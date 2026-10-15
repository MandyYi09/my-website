import * as THREE from 'three';
import { referenceHead, referenceCrown } from './head.js';
import { textureMaterials } from './materials.js';
import { sculptFace, crown, drapery, enrichArmor, flame, scroll, tendril, patch, patina } from './carving.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// A completely modeled, deterministic sculpture. Nothing here is an image plane.
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const TAU = Math.PI * 2;
const materials = {
  headHair: new THREE.MeshStandardMaterial({color:'#30332c',metalness:.08,roughness:.72}),
  crownGem: new THREE.MeshStandardMaterial({color:'#244e59',metalness:.32,roughness:.2}),
  skin: new THREE.MeshStandardMaterial({color:'#596c41',metalness:.08,roughness:.65}),
  eye: new THREE.MeshStandardMaterial({color:'#c2b782',metalness:0,roughness:.35}),
  hairSheen: new THREE.MeshStandardMaterial({color:'#393e32',metalness:.08,roughness:.65}),
  gold: new THREE.MeshStandardMaterial({color:'#cba65b',metalness:.82,roughness:.3}),
  paleGold: new THREE.MeshStandardMaterial({color:'#efd5a0',metalness:.7,roughness:.26}),
  darkGold: new THREE.MeshStandardMaterial({color:'#715034',metalness:.75,roughness:.45}),
  jade: new THREE.MeshStandardMaterial({color:'#579f8d',metalness:.23,roughness:.3}),
  lightJade: new THREE.MeshStandardMaterial({color:'#a6ccb1',metalness:.15,roughness:.36}),
  blue: new THREE.MeshStandardMaterial({color:'#1c404c',metalness:.48,roughness:.3}),
  red: new THREE.MeshStandardMaterial({color:'#9f3934',metalness:.33,roughness:.36}),
  rose: new THREE.MeshStandardMaterial({color:'#bd776e',metalness:.18,roughness:.43}),
  ink: new THREE.MeshStandardMaterial({color:'#10262b',metalness:.2,roughness:.5}),
  ivory: new THREE.MeshStandardMaterial({color:'#e3ddbb',metalness:.1,roughness:.3}),
  gem: new THREE.MeshStandardMaterial({color:'#69e0c0',metalness:.5,roughness:.18,emissive:'#238d6b',emissiveIntensity:.25}),
  pearl: new THREE.MeshStandardMaterial({color:'#cef8d9',roughness:.2,metalness:.1,emissive:'#70c7a2',emissiveIntensity:.5}),
};
Object.entries(materials).forEach(([n,m])=>{m.name=n;m.vertexColors=true;m.side=THREE.DoubleSide;});
materials.jade.color.set('#638b65'); materials.lightJade.color.set('#96b891'); materials.gold.color.set('#d5a658'); materials.blue.color.set('#173949'); materials.ink.color.set('#151919'); materials.red.color.set('#a34735'); materials.pearl.color.set('#bad39b'); materials.pearl.emissiveIntensity=.08;
textureMaterials(materials);
materials.referenceFace=new THREE.MeshStandardMaterial({name:'referenceFace',color:'#a6b39a',roughness:.82,metalness:0,side:THREE.DoubleSide});
export function setReferenceTexture(texture){texture.flipY=false;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;materials.referenceFace.map=texture;materials.referenceFace.needsUpdate=true;}


class Sculptor {
  constructor(name) { this.name=name; this.parts={}; }
  add(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]) {
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
    geo.applyMatrix4(new THREE.Matrix4().compose(V(...pos),q,V(...scale)));
    if(geo.index) { const g=geo.toNonIndexed();geo.dispose();geo=g; }
    if(mat!=='referenceFace')geo.deleteAttribute('uv');geo.deleteAttribute('color');
    (this.parts[mat] ||= []).push(geo);
  }
  ball(pos,scale,mat='gold',segments=20) { this.add(new THREE.SphereGeometry(1,segments,14),mat,pos,scale); }
  torus(pos,r,t,mat='gold',rot=[0,0,0],arc=TAU) { this.add(new THREE.TorusGeometry(r,t,8,Math.max(20,Math.round(r*45)),arc),mat,pos,[1,1,1],rot); }
  rod(a,b,r,mat='gold',r2=r) {
    const p=V(...a),q=V(...b),d=q.clone().sub(p);
    const g=new THREE.CylinderGeometry(r2,r,d.length(),12);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));
    this.add(g,mat,p.add(q).multiplyScalar(.5).toArray());
  }
  tube(points,r,mat='gold',segments=48) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p)));
    this.add(new THREE.TubeGeometry(curve,segments,r,7,false),mat);
  }
  shape(points,depth,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]) {
    const s=new THREE.Shape();s.moveTo(...points[0]);points.slice(1).forEach(p=>s.lineTo(...p));s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2,steps:1});
    this.add(g,mat,pos,scale,rot);
  }
  lathe(profile,mat,pos=[0,0,0],scale=[1,1,1]) {
    this.add(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),80),mat,pos,scale);
  }
  finish() {
    const group=new THREE.Group();group.name=this.name;
    Object.entries(this.parts).forEach(([mat,gs])=> {
      const geo=mergeGeometries(gs);gs.forEach(g=>g.dispose());geo.computeBoundingSphere();
      if(mat!=='referenceFace')patina(geo,mat);
      const p=geo.attributes.position,uv=new Float32Array(p.count*2);
      for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)*1.5+p.getZ(i)*.7;uv[i*2+1]=p.getY(i)*1.5+p.getZ(i)*.35;}
      if(mat!=='referenceFace')geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
      const indexed=mergeVertices(geo,0.00001);geo.dispose();
      const mesh=new THREE.Mesh(indexed,materials[mat]);mesh.name=`${this.name} · ${mat}`;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    });return group;
  }
}

function spiral(b,c,r,mat='gold',turns=1.45,flip=1) {
  const points=[];for(let i=0;i<=44;i++){const t=i/44,rr=r*(1-.9*t),a=t*TAU*turns;points.push([c[0]+Math.cos(a)*rr*flip,c[1]+Math.sin(a)*rr,c[2]+.02*t]);}
  b.tube(points,.014,mat,44);
}
function jewel(b,x,y,z,r=.13) {b.torus([x,y,z],r,.026,'gold');b.ball([x,y,z],[r*.82,r*.82,r*.4],'gem',16);}
function medallion(b,x,y,z,r) {
  b.ball([x,y,z],[r,r,.11],'gold');b.ball([x,y,z+.08],[r*.88,r*.88,.07],'blue');
  b.torus([x,y,z+.13],r*.8,.02,'paleGold');
  for(let j=0;j<8;j++){const a=j*TAU/8;b.ball([x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z+.16],[r*.14,r*.14,.035],'gold',12);}
  jewel(b,x,y,z+.2,r*.27);
}
// Raised, gold-bordered lamellae with rivets, including rear-facing rows.
function scalePlate(b,x,y,z,w,h,mat,ry=0) {
  const outline=[[-w/2,h/2],[w/2,h/2],[w*.48,-h*.18],[w*.30,-h*.48],[0,-h*.58],[-w*.3,-h*.48],[-w*.48,-h*.18]];
  b.shape(outline,.035,'gold',[x,y,z],[1,1,1],[0,ry,0]);
  b.shape(outline,.04,mat,[x+Math.sin(ry)*.026,y+.006,z+Math.cos(ry)*.026],[.82,.8,1],[0,ry,0]);
  b.ball([x+Math.sin(ry)*.081,y+h*.22,z+Math.cos(ry)*.081],[.026,.026,.026],'paleGold',8);
}
function ribbon(b,points,width,mat,twist=0) {
 const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p)));const left=[],right=[];
 const fn=(t,u)=>{const p=curve.getPoint(t),tan=curve.getTangent(t),side=V(-tan.y,tan.x,.45*Math.sin(t*TAU+twist)).normalize();side.applyAxisAngle(tan,Math.sin(t*TAU+twist)*.85);const w=width*(.4+.6*Math.pow(Math.sin(Math.PI*t),.5));const out=p.clone().addScaledVector(side,(u-.5)*w);out.z+=Math.sin(u*Math.PI)*.08;return out.toArray();};
 patch(b,fn,150,12,mat);
 for(let i=0;i<=150;i++){left.push(fn(i/150,0));right.push(fn(i/150,1));}
 b.tube(left,.014,'gold',150);b.tube(right,.014,'gold',150);
 for(let i=0;i<26;i++){const p=fn((i+.5)/26,.52);scroll(b,p[0],p[1],p[2]+.016,width*.11,'paleGold',i%2?1:-1);}
}

function buildBase() {
 const b=new Sculptor('01 · Carved lotus throne');
 b.lathe([[0,0],[2.04,0],[2.10,.08],[2.10,.16],[1.99,.23],[1.99,.40],[1.88,.47],[1.80,.77],[1.90,.94],[1.84,1.03],[0,1.03]],'blue');
 for(let [y,r] of [[.06,2.09],[.17,2.07],[.24,2.0],[.43,1.93],[.99,1.87]])b.torus([0,y,0],r,.024,'gold',[Math.PI/2,0,0]);
 for(let i=0;i<48;i++){
  const a=i*TAU/48;const x=Math.sin(a)*2.008,z=Math.cos(a)*2.008;
  b.ball([x,.31,z],[.045,.048,.045],'gold',12);
 }
 for(let layer=0;layer<2;layer++)for(let i=0;i<20;i++){
  const a=(i+layer*.5)*TAU/20,base=layer?.70:.40;
  const fn=(t,u)=>{const w=Math.pow(Math.sin(Math.PI*t),.65)*.21,ang=a+(u-.5)*w*2,rad=1.72+Math.sin(t*Math.PI)*.24-t*.03;
   return [Math.sin(ang)*rad,base+t*.43+Math.sin(u*Math.PI)*.06,Math.cos(ang)*rad];};
  patch(b,fn,24,16,layer?'rose':'jade');
  for(let u of [0,1])b.tube(Array.from({length:28},(_,j)=>fn(j/27,u)),.014,'gold',28);
  b.tube(Array.from({length:28},(_,j)=>fn(j/27,.5)),.009,'paleGold',28);
 }
 // Carved scroll frieze at the foot of the pedestal, complete around the back.
 for(let i=0;i<24;i++){
  const a=i*TAU/24,local=new Sculptor('frieze');scroll(local,0,.12,2.1,.095,'gold');
  const part=local.finish();part.rotation.y=a;part.updateMatrixWorld(true);
  part.children.forEach(m=>b.add(m.geometry.clone().applyMatrix4(m.matrixWorld),m.material.name));
 }
 b.lathe([[0,1.02],[1.7,1.02],[1.75,1.08],[1.65,1.16],[0,1.16]],'jade');
 b.torus([0,1.09,0],1.73,.03,'gold',[Math.PI/2,0,0]);
 return b.finish();
}

function buildGuardian() {
  const b=new Sculptor('02 · The guardian');
  // Robe silhouette, visible behind the articulated armor.
  b.lathe([[0,2.35],[.8,2.35],[1.06,2.65],[1.1,3.1],[.93,3.6],[.67,4.35],[.63,4.6],[0,4.6]],'red',[0,0,-.12],[1,1,.62]);
  for(let i=0;i<26;i++){
    const a=i*TAU/26,pts=[];for(let j=0;j<=12;j++){const y=2.4+j*.17,r=1.03-(y-2.5)*.18;pts.push([Math.sin(a)*r,y,Math.cos(a)*r*.63-.12]);}
    b.tube(pts,.019,i%3?'darkGold':'gold',20);
  }
  // Boots, greaves, knee disks.
  [-1,1].forEach(s=>{
    b.ball([s*.62,1.49,.13],[.34,.32,.65],'blue');
    b.ball([s*.62,1.46,.55],[.29,.19,.4],'red');
    b.tube([[s*.62,1.5,.6],[s*.65,1.55,.9],[s*.69,1.7,1.02],[s*.71,1.81,.99]],.085,'gold');
    b.rod([s*.62,1.53,0],[s*.59,2.77,-.11],.245,'red',.32);
    for(let j=0;j<8;j++) {
      const y=1.7+j*.12;
      b.torus([s*.62,y,-.01],.26+j*.004,.025,'gold',[Math.PI/2,0,0]);
    }
    b.shape([[-.19,-.43],[.19,-.43],[.28,.39],[0,.56],[-.28,.39]],.09,'blue',[s*.61,2.02,.26]);
    spiral(b,[s*.61,2.08,.37],.17,'paleGold');medallion(b,s*.58,2.71,.32,.32);
    for(let j=0;j<5;j++) b.tube([[s*.85,1.55,.27+j*.08],[s*.63,1.65,.28+j*.08],[s*.41,1.55,.27+j*.08]],.018,'gold',16);
  });
  // Twelve flared skirt panels, double-sided detail around the whole waist.
  for(let panel=0;panel<12;panel++){
    const angle=panel*TAU/12;
    for(let row=0;row<6;row++) for(let col=0;col<3;col++){
      const a=angle+(col-1)*.15+(row%2)*.025,r=.74+(5-row)*.084;
      scalePlate(b,Math.sin(a)*r,2.91+row*.225,Math.cos(a)*r*.76,.19,.29,(panel+row)%5===0?'darkGold':'gold',a);
    }
  }
  // Front apron, gilded border and chasing.
  const apron=[[-.31,.8],[.31,.8],[.41,-.72],[.24,-.96],[0,-1.07],[-.24,-.96],[-.41,-.72]];
  b.shape(apron,.06,'gold',[0,3.3,.99]);b.shape(apron,.07,'blue',[0,3.32,1.06],[.88,.94,1]);
  for(let i=0;i<6;i++){spiral(b,[(i%2?1:-1)*.12,2.63+i*.23,1.15],.13,'paleGold',1.1,i%2?1:-1);}
  // Torso and engraved gorget.
  b.ball([0,5.18,0],[.91,1.01,.5],'blue',32);
  for(let row=0;row<6;row++)for(let side=0;side<2;side++)for(let col=0;col<9;col++){
    const a=-1.18+col*.295+side*Math.PI,r=.89*Math.sqrt(1-((4.5+row*.23-5.17)/1.18)**2);
    // Adjacent armor rows overlap in height, so they must not share a depth plane.
    const lift=row*.017;
    scalePlate(b,Math.sin(a)*(r+lift),4.5+row*.23,Math.cos(a)*(.49+lift),.205,.29,row%4===0?'blue':'gold',a);
  }
  b.lathe([[.62,4.12],[.76,4.15],[.77,4.36],[.65,4.42]],'red',[0,0,0],[1,1,.7]);
  for(let i=0;i<20;i++){const a=i*TAU/20;b.ball([.76*Math.sin(a),4.26,.54*Math.cos(a)],[.09,.09,.07],'gold',12);}
  medallion(b,0,4.24,.63,.25);
  b.tube([[-.83,5.73,.13],[-.62,5.54,.43],[0,5.31,.59],[.62,5.54,.43],[.83,5.73,.13]],.095,'gold');
  b.tube([[-.66,5.91,.22],[-.4,5.65,.46],[0,5.54,.52],[.4,5.65,.46],[.66,5.91,.22]],.073,'jade');
  medallion(b,0,5.55,.56,.31);
  // Shoulder shells and articulated arms. Right hand presents the pearl.
  [-1,1].forEach(s=>{
    const elbow=[s*1.38,4.76,.03],hand=s<0?[-1.98,4.94,.62]:[1.58,5.1,.91];
    b.rod([s*.93,5.58,0],elbow,.30,'red',.34);
    b.ball([s*1.0,5.67,0],[.73,.43,.66],'gold');
    b.ball([s*1.03,5.73,.015],[.66,.34,.62],'jade');
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const a=-1.2+col*.6;
      scalePlate(b,s*1.03+Math.sin(a)*(.49+row*.045),5.52-row*.16,Math.cos(a)*(.55+row*.019),.22,.28,row%2?'red':'blue',a);
    }
    medallion(b,s*1.1,5.67,.57,.24);
    // Decorative dragon-like shoulder crest.
    b.tube([[s*.81,5.87,.0],[s*1.16,6.07,.0],[s*1.47,6.0,.02],[s*1.72,6.12,.0]],.07,'gold');
    b.rod(elbow,hand,.25,'red',.22);
    for(let j of [0,.18,.82,1]){const p=V(...elbow).lerp(V(...hand),j),axis=V(...hand).sub(V(...elbow)).normalize();
      const geo=new THREE.TorusGeometry(.24,.025,8,32);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,0,1),axis));b.add(geo,'gold',p.toArray());}

    b.ball(hand,[.23,.16,.21],'jade');
    // Four separately sculpted curled fingers and a thumb.
    for(let j=0;j<4;j++){
      const x=hand[0]-.15+j*.095;
      b.tube([[x,hand[1]-.01,hand[2]+.07],[x,hand[1]+.1,hand[2]+.21],[x,hand[1]+.23,hand[2]+.13]],.046,'jade',12);
    }
    b.tube([[hand[0]+s*.16,hand[1]-.05,hand[2]],[hand[0]+s*.26,hand[1]+.04,hand[2]+.1],[hand[0]+s*.22,hand[1]+.15,hand[2]+.14]],.065,'jade',12);
  });
  referenceHead(b);
  referenceCrown(b);
  drapery(b);
  enrichArmor(b);
  // Back medallion and braided hanging cords, rewards for orbiting.
  const back=new Sculptor('temporary'); // Back-facing ornament is authored separately then rotated.
  medallion(back,0,5.23,.52,.49);spiral(back,[0,5.23,.76],.24,'gold',2);
  const backGroup=back.finish();backGroup.rotation.y=Math.PI;
  backGroup.updateMatrixWorld(true);
  backGroup.children.forEach(m=>b.add(m.geometry.clone().applyMatrix4(m.matrixWorld),m.material.name));
  for(let s of [-1,1]) b.tube([[s*.42,5.76,-.4],[s*.54,4.9,-.59],[s*.35,4.2,-.73],[s*.63,3.65,-.77]],.042,'gold');
  return b.finish();
}

function buildHalo(){
 const b=new Sculptor('03 · Carved celestial aureole');const cy=6.73,z=-.77,r=1.69;
 b.add(new THREE.CylinderGeometry(r,r,.13,128,1), 'darkGold',[0,cy,z],[1,1,1],[Math.PI/2,0,0]);
 b.add(new THREE.CylinderGeometry(r-.12,r-.12,.14,128,1), 'jade',[0,cy,z+.035],[1,1,1],[Math.PI/2,0,0]);
 for(let radius of [r,r-.075,r-.16,r-.26])b.torus([0,cy,z+.13],radius,.022,'gold');
 for(let i=0;i<50;i++){const a=i*TAU/50;scroll(b,Math.sin(a)*(r-.12),cy+Math.cos(a)*(r-.12),z+.16,.068,'gold',i%2?1:-1);}
 for(let i=0;i<12;i++){const a=i*TAU/12,rad=1.27;cloud(b,Math.sin(a)*rad,cy+Math.cos(a)*rad,z+.18,.30,i%3===0?'rose':'paleGold',i%2?1:-1);}
 for(let i=0;i<30;i++){const a=i*TAU/30;scroll(b,Math.sin(a)*1.0,cy+Math.cos(a)*1.0,z+.16,.11,'gold');}
 // Engraving remains present on the reverse of the disk.
 for(let i=0;i<28;i++){const a=i*TAU/28;b.torus([Math.sin(a)*1.4,cy+Math.cos(a)*1.4,z-.105],.09,.018,'gold');}
 b.torus([0,cy,z-.12],1.18,.024,'gold');b.torus([0,cy,z-.12],1.50,.024,'gold');
 return b.finish();
}

function buildStaff(){
  const b=new Sculptor('04 · Moon staff');const x=-2.01,z=.71;
  b.rod([x,1.05,z],[x,7.29,z],.076,'gold');
  for(let j=0;j<19;j++){scroll(b,x,1.45+j*.29,z+.083,.07,'paleGold',j%2?1:-1);}
  for(let j=0;j<8;j++){b.ball([x,4.73+j*.30,z],[.12,.17,.11],'gold');b.ball([x,4.73+j*.30,z+.10],[.065,.10,.035],'gem');}
  for(let j=0;j<44;j++){b.torus([x,1.36+j*.125,z],.066,.015,j%4?'gold':'jade',[Math.PI/2,0,0]);}
  b.ball([x,1.2,z],[.11,.16,.11],'gold');b.ball([x,7.27,z],[.14,.16,.14],'gold');
  b.torus([x,7.68,z],.42,.065,'gold',[0,0,-Math.PI*.2],Math.PI*1.4);
  b.ball([x,7.69,z],[.2,.2,.2],'pearl',24);
  b.torus([x,7.69,z],.28,.012,'gold',[.5,.3,0]);
  for(let s of [-1,1]){
    b.tube([[x+s*.27,7.33,z],[x+s*.39,7.05,z],[x+s*.3,6.78,z]],.023,'gold');
    b.ball([x+s*.3,6.76,z],[.06,.09,.06],'red');
    for(let k=0;k<5;k++)b.tube([[x+s*.3+(k-2)*.021,6.7,z],[x+s*.31+(k-2)*.024,6.35,z+.025]],.012,'red',12);
  }
  // Offering orb and its open lattice cage.
  b.ball([1.6,5.52,1.02],[.38,.38,.38],'lightJade',64);
  flame(b,x-.33,7.22,z,.4,.65,'gold',.25);flame(b,x+.29,7.27,z,.4,.55,'gold',-.3);
  return b.finish();
}

function buildRibbons(){
  const b=new Sculptor('05 · Wind ribbons');
  ribbon(b,[[-.55,5.9,-.15],[-1.52,6.45,-.2],[-2.61,6.3,.12],[-3.05,5.51,.46],[-2.49,5.13,.78],[-1.58,5.68,.68],[-1.75,4.47,.33],[-2.9,3.57,.5],[-2.9,2.85,1.01],[-1.8,2.99,1.26],[-1.2,2.33,1.1],[-1.74,1.82,.83]],.48,'jade');
  ribbon(b,[[.56,5.9,-.1],[1.51,6.41,-.05],[2.64,6.68,.13],[3.02,6.08,.35],[2.48,5.69,.83],[2.03,6.12,.83],[2.26,4.88,.45],[3.1,4.15,.58],[3.18,3.48,1.08],[2.64,3.17,1.22],[1.72,3.45,1.15],[1.5,2.59,1.28],[2.29,2.07,1.03]],.46,'lightJade',1.2);
  ribbon(b,[[.1,4.18,.74],[.6,3.82,1.28],[.95,2.77,1.32],[.62,1.99,1.24],[.02,1.76,1.45],[-.42,2.0,1.54]],.17,'red',.3);
  ribbon(b,[[-.22,4.14,.72],[-.82,3.8,1.15],[-1.0,3.05,1.2],[-.48,2.79,1.31],[-.22,2.43,1.4]],.16,'lightJade',.2);
  const group=b.finish();group.traverse(o=>{if(o.isMesh)o.material.side=THREE.DoubleSide;});return group;
}

function cloud(b,x,y,z,size,mat,flip=1) {
 const form=new THREE.Shape();form.moveTo(-.70,-.23);
 form.bezierCurveTo(-1.02,-.22,-1.0,.16,-.70,.16);
 form.bezierCurveTo(-.87,.59,-.27,.66,-.15,.34);
 form.bezierCurveTo(.04,.77,.68,.53,.55,.16);
 form.bezierCurveTo(1.02,.33,1.08,-.23,.65,-.25);
 form.bezierCurveTo(.41,-.53,-.32,-.53,-.70,-.23);
 const g=new THREE.ExtrudeGeometry(form,{depth:.13,bevelEnabled:true,bevelSize:.10,bevelThickness:.09,bevelSegments:4,curveSegments:18});
 b.add(g,mat,[x,y,z],[size,size,size],[0,flip<0?Math.PI:0,0]);
 for(let face of [-1,1]){
  scroll(b,x-.33*size,y+.12*size,z+face*.24*size,.24*size,'paleGold',flip);
  scroll(b,x+.27*size,y+.11*size,z+face*.24*size,.24*size,'paleGold',-flip);
  const p=[[-.8,-.23],[-.46,-.35],[0,-.37],[.42,-.32],[.77,-.19]].map(([u,v])=>[x+u*size,y+v*size,z+face*.18*size]);
  b.tube(p,.022*size,'gold',28);
 }
}

function buildClouds(){
 const group=new THREE.Group();group.name='06 · Carved cloud banks';
 for(let i=0;i<22;i++){
  const a=i*2.399,r=1.30+(i%4)*.27,x=Math.sin(a)*r,z=Math.cos(a)*r*.55;
  const y=1.13+(i%5)*.21+(Math.abs(x)>1.6?.3:0),b=new Sculptor(`Cloud bank ${i+1}`);
  cloud(b,x,y,z,.42+(i%3)*.09,['jade','rose','paleGold'][i%3],i%2?1:-1);group.add(b.finish());
 }
 for(let s of [-1,1])for(let i=0;i<4;i++){const b=new Sculptor(`Rising cloud ${s} ${i}`);cloud(b,s*(1.75+Math.sin(i)*.16),2.0+i*.61,-.45,.45-i*.045,i%2?'lightJade':'rose',s);group.add(b.finish());}
 return group;
}

export function createSculpture(){
  const root=new THREE.Group();root.name='The Keeper of the Cloud Gate';
  const parts={pedestal:buildBase(),guardian:buildGuardian(),halo:buildHalo(),staff:buildStaff(),ribbons:buildRibbons(),clouds:buildClouds()};
  Object.values(parts).forEach(p=>root.add(p));
  root.scale.x=-1; // Match the concept: staff on the viewer’s right, offering pearl on the left.
  root.userData={revision:2,stabilityRevision:1,headRevision:'3.0',title:'The Keeper of the Cloud Gate',description:'An original celestial guardian inspired by the supplied Chinese guardian paintings. Procedurally sculpted as real 3D geometry.',author:'Original project artwork',units:'meters (artistic scale)'};
  return {root,parts,materials};
}
