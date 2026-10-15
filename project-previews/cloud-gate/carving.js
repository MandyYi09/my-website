import * as THREE from 'three';
const TAU=Math.PI*2;
const v=p=>new THREE.Vector3(...p);

// Swept tapered locks and tendrils: continuous surfaces, with pointed ends.
export function tendril(b,points,r,mat='gold',groove=0){
 const curve=new THREE.CatmullRomCurve3(points.map(v));const N=r<.02?16:30,R=r<.02?5:7,frames=curve.computeFrenetFrames(N,false),p=[],idx=[];
 for(let i=0;i<=N;i++){const t=i/N,c=curve.getPoint(t),rad=r*Math.pow(Math.max(.008,Math.sin((.08+t*.92)*Math.PI)),.65);
  for(let j=0;j<=R;j++){const a=j/R*TAU,rr=rad*(1+groove*Math.cos(a*5));const pt=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*rr).addScaledVector(frames.binormals[i],Math.sin(a)*rr);p.push(...pt);if(i<N&&j<R){const k=i*(R+1)+j;idx.push(k,k+R+1,k+1,k+1,k+R+1,k+R+2);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();b.add(g,mat);
}

export function patch(b,fn,nu,nv,mat){
 const p=[],idx=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){p.push(...fn(i/nu,j/nv));if(i<nu&&j<nv){const k=i*(nv+1)+j;idx.push(k,k+1,k+nv+1,k+1,k+nv+2,k+nv+1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();b.add(g,mat);
}

// Scroll relief is attached to the actual curved armor, rather than flat decals.
export function scroll(b,x,y,z,r,mat='gold',flip=1){
 const p=[];for(let i=0;i<=48;i++){let t=i/48,a=t*TAU*1.28,rr=r*(1-t*.92);p.push([x+Math.cos(a)*rr*flip,y+Math.sin(a)*rr,z+.018*Math.sin(t*Math.PI)]);}tendril(b,p,r*.12,mat);
 for(let i=0;i<3;i++){const t=.16+i*.18,a=t*TAU*1.28,rr=r*(1-t*.92),cx=x+Math.cos(a)*rr*flip,cy=y+Math.sin(a)*rr;
 tendril(b,[[cx,cy,z],[cx+r*.22*flip,cy+r*.22,z+.02],[cx+r*.12*flip,cy+r*.38,z]],r*.055,mat);}
}

export function beastMask(b,x,y,z,s=1){
 // Taotie-inspired invented armor ornament, with pierced mouth and curling brows.
 b.ball([x,y,z],[.28*s,.30*s,.10*s],'darkGold',24);
 for(let side of [-1,1]){
  b.ball([x+side*.18*s,y+.05*s,z+.09*s],[.16*s,.16*s,.09*s],'gold',24);
  tendril(b,[[x+side*.02*s,y+.18*s,z+.15*s],[x+side*.20*s,y+.25*s,z+.16*s],[x+side*.39*s,y+.16*s,z+.10*s],[x+side*.45*s,y+.33*s,z]],.065*s);
  b.ball([x+side*.12*s,y+.07*s,z+.19*s],[.065*s,.032*s,.027*s],'ink',14);
  b.ball([x+side*.11*s,y+.07*s,z+.215*s],[.022*s,.027*s,.015*s],'gem',12);
  scroll(b,x+side*.28*s,y-.02*s,z+.07*s,.17*s,'gold',side);
  tendril(b,[[x+side*.02*s,y-.09*s,z+.23*s],[x+side*.22*s,y-.04*s,z+.2*s],[x+side*.26*s,y-.20*s,z+.08*s]],.045*s);
  for(let j=0;j<3;j++)tendril(b,[[x+side*.12*s,y+.2*s,z],[x+side*(.25+j*.08)*s,y+(.3+j*.08)*s,z],[x+side*(.2+j*.13)*s,y+(.43+j*.1)*s,z]],.028*s);
 }
 b.ball([x,y-.02*s,z+.17*s],[.085*s,.095*s,.10*s],'gold');
 b.ball([x,y-.17*s,z+.10*s],[.135*s,.07*s,.055*s],'ink');
 for(let j=0;j<5;j++)b.ball([x+(j-2)*.045*s,y-.135*s,z+.158*s],[.018*s,.03*s,.014*s],'paleGold',10);
 tendril(b,[[x-.13*s,y-.22*s,z+.1*s],[x,y-.29*s,z+.17*s],[x+.13*s,y-.22*s,z+.1*s]],.04*s);
}

export function sculptFace(b){
 const begins=Object.fromEntries(Object.entries(b.parts).map(([k,gs])=>[k,gs.length]));
 const gauss=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
 const height=(x,y)=>{
  const ax=Math.abs(x);let h=0;
  // Strong low orbital rims, broad nasal bridge, flared alae, and cheek planes.
  const browY=6.88+ax*.26;
  h+=.12*Math.exp(-(((y-browY)/.068)**2))*Math.exp(-(((ax-.21)/.24)**4));
  h+=.15*gauss(x,y,0,6.87,.075,.21);
  h+=.22*gauss(x,y,0,6.70,.090,.20);
  h+=.23*gauss(x,y,0,6.575,.117,.071);
  for(let s of [-1,1]){
   h+=.11*gauss(x,y,s*.114,6.558,.061,.050);
   h+=.14*gauss(x,y,s*.30,6.615,.14,.085);
   h+=.065*gauss(x,y,s*.29,6.385,.12,.15);
   h-=.09*gauss(x,y,s*.225,6.807,.13,.051);
   h-=.055*gauss(x,y,s*.245,6.487,.057,.079);
   h-=.029*gauss(x,y,s*.06,6.985,.018,.12);
  }
  h+=.065*gauss(x,y,0,6.37,.21,.090);
  return h;
 };
 const surface=(x,y)=>{
  const ny=(y-6.70)/.59;
  const nx=x/(.49*(.95+.05*(ny+1)/2));
  return .08+.42*Math.sqrt(Math.max(.005,1-nx*nx-ny*ny))+height(x,y);
 };
 b.rod([0,5.9,-.04],[0,6.43,-.04],.30,'skin');
 b.ball([0,6.7,-.1],[.54,.68,.44],'ink',48);
 const g=new THREE.SphereGeometry(1,144,112),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),y=6.70+py*.59;
  const x=px*.49*(.95+.05*(py+1)/2);
  let z=.08+pz*.42;
  if(pz>0)z+=height(x,y)*Math.min(1,pz*4);
  p.setXYZ(i,x,y,z);
 }g.computeVertexNormals();b.add(g,'skin');
 for(let s of [-1,1]){
  // Small recessed ear and a sculpted helix, framed by hair.
  b.ball([s*.485,6.64,-.015],[.105,.21,.105],'skin',28);
  tendril(b,[[s*.49,6.78,.09],[s*.53,6.66,.14],[s*.48,6.49,.11]],.023,'skin');
  b.torus([s*.49,6.42,.045],.085,.018,'gold');
  // Recessed sockets and three-dimensionally curved almond eyes.
  const eyeSurface=(u,t,outer=false)=>{
   const x=s*((outer?.057:.082)+u*(outer?.335:.273));
   const cy=6.775+u*.07;
   const half=(outer?.073:.044)*Math.pow(Math.sin(u*Math.PI),.8);
   const y=cy+(t-.5)*2*half;
   return [x,y,surface(x,y)+(outer?.012:.025)+Math.sin(t*Math.PI)*.009];
  };
  patch(b,(u,t)=>eyeSurface(u,t,true),38,12,'ink');
  patch(b,(u,t)=>eyeSurface(u,t,false),38,12,'eye');
  const ex=s*.202,ey=6.805,ez=surface(ex,ey)+.044;
  b.ball([ex,ey,ez],[.033,.036,.018],'darkGold',24);
  b.ball([ex,ey,ez+.015],[.013,.028,.012],'ink',20);
  b.ball([ex-s*.008,ey+.012,ez+.027],[.006,.007,.004],'ivory',10);
  const lid=[];for(let j=0;j<=24;j++){const q=eyeSurface(j/24,1,false);q[2]+=.022;lid.push(q);}tendril(b,lid,.026,'skin');
  const lower=[];for(let j=0;j<=24;j++){const q=eyeSurface(j/24,0,false);q[1]-=.012;q[2]+=.014;lower.push(q);}tendril(b,lower,.017,'skin');
  // Downward inner brow presses over the eye; individual hairs sweep outward.
  for(let j=0;j<20;j++){
   const t=j/19,x=s*(.066+t*.31),y=6.86+t*.10,z=surface(x,y)+.012;
   tendril(b,[[x,y,z],[x+s*.04,y+.023,z+.012],[x+s*.10,y+.085,z-.032]],.013,'ink');
  }
  const fold=[[s*.045,6.91],[s*.09,7.03],[s*.21,7.09]];
  tendril(b,fold.map(([x,y])=>[x,y,surface(x,y)+.010]),.014,'skin');
  // Nostrils lie under the flared nose, followed by a pronounced nasolabial crease.
  const nx=s*.096,ny=6.534,nz=surface(nx,ny)+.014;
  b.ball([nx,ny,nz],[.041,.021,.013],'ink',24);
  const cheek=[[s*.13,6.52],[s*.205,6.45],[s*.245,6.33]];
  tendril(b,cheek.map(([x,y])=>[x,y,surface(x,y)+.016]),.017,'skin');
  // Thick, downturned moustache with irregular locks, rather than horizontal bars.
  for(let j=0;j<20;j++){
   const t=j/19,dy=(t-.5)*.082;
   tendril(b,[[s*(.035+t*.035),6.49+dy,.659],[s*.17,6.425+dy,.675],[s*(.32+t*.025),6.35+dy,.602],[s*(.43+t*.028),6.39+dy,.455]],.019,'ink');
  }
  b.ball([s*.069,6.465,.646],[.061,.046,.032],'ink',24);
  // Sideburns join the beard with a varied, organic silhouette.
  for(let j=0;j<26;j++){
   const t=j/25;
   tendril(b,[[s*(.43+t*.045),6.94-t*.19,.12+t*.10],[s*(.50+t*.06),6.65-t*.14,.22+t*.12],[s*(.48+t*.10),6.35-t*.24,.29],[s*(.34+t*.09),6.03-t*.28,.33]],.025,'ink',.07);
  }
 }
 // Dark open mouth under an angular lip; two slivers of teeth catch the light.
 const mouth=new THREE.Shape();mouth.moveTo(-.16,6.35);mouth.quadraticCurveTo(0,6.395,.16,6.35);mouth.quadraticCurveTo(0,6.285,-.16,6.35);
 b.add(new THREE.ExtrudeGeometry(mouth,{depth:.018,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}),'ink',[0,0,.563]);
 b.tube([[-.105,6.357,.591],[0,6.369,.603],[.105,6.357,.591]],.011,'eye',24);
 tendril(b,[[-.145,6.325,.558],[0,6.294,.597],[.145,6.325,.558]],.025,'skin');
 // Dense beard: interlocking, asymmetrically sweeping locks with tapered tips.
 for(let layer=0;layer<3;layer++)for(let j=0;j<33;j++){
  const u=j/32*2-1,x=u*(.29+layer*.015),wave=Math.sin(j*2.41+layer)*.035;
  const len=.91-Math.abs(u)*.25+Math.sin(j*1.63+layer)*.06;
  const endX=.16+x*.58+Math.sin(j*.83)*.055;
  const points=[[x,6.25+Math.abs(u)*.095,.43+layer*.063],[x+wave,6.03,.53+layer*.058],[x*.76+.10+wave,6.25-len*.71,.53+layer*.05],[endX,6.22-len,.38+layer*.035]];
  tendril(b,points,.032,'ink',.12);
  if(j%2===0)tendril(b,points.map(q=>[q[0]+.008,q[1],q[2]+.026]),.003,'hairSheen');
 }
 // A subtle head turn breaks the mannequin symmetry while keeping the crown aligned.
 const pivot=new THREE.Vector3(0,6.66,0),matrix=new THREE.Matrix4().makeTranslation(...pivot.toArray());
 matrix.multiply(new THREE.Matrix4().makeRotationY(-.10)).multiply(new THREE.Matrix4().makeTranslation(...pivot.clone().negate().toArray()));
 for(const [mat,gs] of Object.entries(b.parts))for(let i=begins[mat]??0;i<gs.length;i++)gs[i].applyMatrix4(matrix);
}

export function flame(b,x,y,z,w,h,mat='gold',tilt=0){
 const s=new THREE.Shape();s.moveTo(-.2,0);s.bezierCurveTo(-.55,.29,.28,.4,-.03,.69);s.bezierCurveTo(-.18,.83,.05,.92,.12,1.08);s.bezierCurveTo(.39,.65,.05,.6,.25,.37);s.bezierCurveTo(.53,.1,.17,-.1,-.2,0);
 b.add(new THREE.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.026,bevelThickness:.022,bevelSegments:3,curveSegments:22}),mat,[x,y,z],[w,h,1],[0,0,tilt]);
}
export function crown(b){
 b.lathe([[.46,7.04],[.55,7.09],[.55,7.28],[.48,7.36]],'gold',[0,0,0],[1,1,.84]);
 for(let j=0;j<11;j++){const a=(j-5)*.28,x=Math.sin(a)*.54,z=Math.cos(a)*.455;scroll(b,x,7.19,z,.08,'paleGold',j%2?1:-1);}
 for(let j=0;j<7;j++){let a=(j-3)*.34,x=Math.sin(a)*.67,z=Math.cos(a)*.30,h=1.05-Math.abs(j-3)*.19;flame(b,x,7.25,z,.63,h,'gold',-a*.45);flame(b,x,7.29,z+.075,.35,h*.8,'red',-a*.45);}
 for(let s of [-1,1]){
  flame(b,s*.67,6.98,-.1,.75,1.1,'red',-s*.35);flame(b,s*.69,7.03,-.04,.40,1.05,'gold',-s*.35);
  scroll(b,s*.32,7.43,.43,.19,'gold',s);
 }
 for(let [y,r] of [[7.32,.13],[7.67,.16]]){b.ball([0,y,.40],[r*1.3,r*1.55,.08],'gold');b.ball([0,y,.49],[r,r*1.23,.055],'gem');b.torus([0,y,.48],r*1.22,.022,'paleGold');}
}

export function drapery(b){
 // Scalloped cloth sweeps create broad, weighty layered silhouettes.
 for(let s of [-1,1])for(let layer=0;layer<3;layer++){
  const fn=(u,t)=>{const a=-.65+u*2.45,spread=.42+t*.77;return [s*(.78+Math.sin(a)*spread),5.82-t*(1.25+layer*.27)+Math.sin(u*Math.PI)*.22-Math.sin(u*4.7+.6)*t*.27,Math.cos(a)*(.59+t*.22)-.24+layer*.025+Math.sin(u*Math.PI*7)*.075*t];};
  patch(b,fn,60,32,layer%2?'ivory':'red');
  const edge=Array.from({length:70},(_,i)=>fn(i/69,1));b.tube(edge,.032,'gold',70);
  const inner=Array.from({length:70},(_,i)=>fn(i/69,.90));b.tube(inner,.014,'gold',70);
  for(let j=0;j<12;j++){const p=fn((j+.5)/12,.83);scroll(b,p[0],p[1],p[2]+.025,.065,'gold',s);}
 }
 // Alternating lapis, jade and ivory skirt panels bow away from the legs.
 for(let i=0;i<10;i++){
  const a=i*TAU/10;
  const fn=(u,t)=>{let angle=a+(u-.5)*.57,r=.73+t*.74+Math.sin(t*Math.PI)*.10,y=4.15-t*(1.67+.15*Math.cos(i*2))-Math.sin(u*Math.PI)*.14;
   return [Math.sin(angle)*r,y,Math.cos(angle)*r*.73+Math.sin(t*Math.PI*1.8+u*4)*.10];};
  patch(b,fn,20,40,i%3===0?'ivory':i%3===1?'blue':'red');
  for(let u of [0,1])b.tube(Array.from({length:45},(_,j)=>fn(u,j/44)),.025,'gold',45);
  b.tube(Array.from({length:30},(_,j)=>fn(j/29,1)),.028,'gold',30);
  for(let j=0;j<7;j++){const p=fn(.5,j/8+.1);scroll(b,p[0],p[1],p[2]+Math.cos(a)*.045,.08,'gold',i%2?1:-1);}
 }
}

export function enrichArmor(b){
 beastMask(b,0,4.20,.83,1.25);
 for(let s of [-1,1]){
  beastMask(b,s*1.12,5.68,.59,.82);beastMask(b,s*.60,2.66,.44,.88);
  for(let i=0;i<4;i++){scroll(b,s*(.41+i*.12),5.27-i*.19,.56,.15,'gold',s);}
  // Cascading beads and pendants below the shoulder shells.
  for(let k=0;k<8;k++){const x=s*(.83+k*.09),y=5.36-k*.027;for(let j=0;j<3;j++)b.ball([x,y-j*.065,.49],[.026,.027,.023],'gold',9);}
 }
 for(let row=0;row<3;row++)for(let col=0;col<9;col++){const x=(col-4)*.155,y=4.58+row*.17;scroll(b,x,y,.56,.055,'gold',col%2?1:-1);}
}

// Deterministic material variation survives GLB export as vertex color.
export function patina(geo,name){
 const p=geo.attributes.position,n=geo.attributes.normal,a=new Float32Array(p.count*3);
 const stone=['jade','lightJade','rose','pearl'].includes(name),metal=['gold','paleGold','darkGold'].includes(name);
 const col=new THREE.Color();
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const wave=Math.sin(x*6+Math.sin(y*9+z*4)*1.2)+Math.sin(y*13+Math.sin(z*9+x*6)*2.3)*.5;
  const grain=(Math.sin(x*143.3+y*98.1+z*173.7)*Math.sin(y*127.2-z*94.1)+1)*.5;
  let shade=.80+grain*.16;
  if(stone){const vein=Math.pow(Math.max(0,1-Math.abs(Math.sin(wave*3+y*2))/.12),2);shade=.60+.29*(wave+1.5)/3+vein*.29;col.setRGB(shade*(1+vein*.07),shade,shade*.96);}
  else if(metal){const age=Math.max(0,Math.sin(x*21+y*19+Math.sin(z*14))*Math.sin(z*25-y*12));shade=.65+grain*.24-age*.20;col.setRGB(shade,shade*.93,shade*.78);}
  else {shade=.69+grain*.14+wave*.065;col.setRGB(shade,shade,shade);}
  a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b;
 }geo.setAttribute('color',new THREE.BufferAttribute(a,3));
}
