import * as THREE from 'three';
import { segments as detail } from './detail.js';
import { tendril, scroll, patch, flame } from './carving.js';
const TAU=Math.PI*2;
// Original concept landmarks, in the unmodified 1024 × 1536 reference image.
// Front-face color uses the original image; the form, sides, hair and crown are geometry.
const rows=[
 [209,472,487],[213,462,506],[221,454,527],[231,450,533],
 [243,447,535],[255,445,535],[269,442,533],[282,443,531],
 [294,450,525],[303,462,514],[310,478,499],[313,486,491]
];
const G=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
const coord=(px,py,z)=>[(489-px)*.0112,7.20-(py-210)*.0104,z];
function anatomy(px,py){
 let z=.22+.25*Math.sqrt(Math.max(0,1-((px-489)/48)**2));
 // Wide nasal tip/alae, hard supraorbital arch, sculpted cheek and muzzle planes.
 z+=.14*G(px,py,488,261,7.0,13)+.135*G(px,py,486,269,10.2,5.5);
 z+=.12*G(px,py,478,270,4.1,3.8)+.12*G(px,py,496,271,4.0,3.7);
 z+=.09*G(px,py,456,265,8,6)+.10*G(px,py,520,270,8,6);
 z+=.08*G(px,py,468,242,13,3.3)+.07*G(px,py,511,246,12,3.4);
 z-=.07*G(px,py,468,249,9,4)+.07*G(px,py,510,253,9,4);
 z-=.038*G(px,py,462,280,4,8)+.038*G(px,py,518,282,4,8);
 z+=.05*G(px,py,483,285,12,3)+.08*G(px,py,485,300,12,6);
 return z;
}
function limits(y){for(let i=0;i<rows.length-1;i++){if(y<=rows[i+1][0]){const t=(y-rows[i][0])/(rows[i+1][0]-rows[i][0]);return [rows[i][1]*(1-t)+rows[i+1][1]*t,rows[i][2]*(1-t)+rows[i+1][2]*t];}}return rows.at(-1).slice(1);}
export function referenceHead(b){
 b.rod([0,5.9,-.13],[0,6.61,-.13],.29,'skin');
 b.ball([0,6.73,-.10],[.54,.62,.46],'headHair',48);
 // A dense curved facial shell; it is not a billboard or a flat image plane.
 const NX=detail(112,32),NY=detail(144,40),pos=[],uv=[],idx=[];
 for(let j=0;j<=NY;j++){
  const py=209+j/NY*104,[l,r]=limits(py);
  for(let i=0;i<=NX;i++){
   const px=l+(r-l)*i/NX;pos.push(...coord(px,py,anatomy(px,py)));uv.push(px/1024,py/1536);
   if(j<NY&&i<NX){const k=j*(NX+1)+i;idx.push(k,k+1,k+NX+1,k+1,k+NX+2,k+NX+1);}
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();b.add(geo,'referenceFace');
 // Close the face at the temple/cheek into the back of the head with shaped skin.
 for(let side of [0,1]){
  patch(b,(u,t)=>{const py=218+u*87,[l,r]=limits(py),px=side?r:l,front=coord(px,py,anatomy(px,py));
   return [front[0]*(1-.09*t),front[1],front[2]*(1-t)-.20*t];},96,12,'skin');
 }
 for(let s of [-1,1]){
  b.ball([s*.535,6.71,-.025],[.083,.20,.105],'skin',28);
  tendril(b,[[s*.535,6.83,.045],[s*.59,6.75,.075],[s*.535,6.55,.035]],.023,'skin');
  b.torus([s*.54,6.50,.025],.073,.014,'gold');
  // Swept temple locks above the ears; no straight hanging side curtains.
  for(let j=0;j<30;j++){
   const t=j/29;
   tendril(b,[[s*(.35+.09*t),7.08-t*.06,.17],[s*(.57+.06*t),6.93-t*.05,.15],[s*(.68+.05*t),6.99-t*.11,-.025],[s*(.61+.1*t),7.12-t*.17,-.18]],.020,'headHair',.12);
  }
  for(let j=0;j<30;j++){
   const t=j/29;
   tendril(b,[[s*.49,6.91-t*.29,-.09],[s*(.61+t*.025),6.72-t*.28,-.03],[s*(.57+t*.07),6.46-t*.26,-.09],[s*.46,6.14-t*.13,-.12]],.022,'headHair',.10);
  }
  // Sculpted moustache follows the image's drooping S contour, not a rigid handlebar.
  for(let j=0;j<28;j++){
   const t=j/27,dy=(t-.5)*.064;
   const path=s===1?[[0,6.49+dy,.62],[.18,6.465+dy,.635],[.36,6.30+dy,.58],[.46,6.24+dy,.39],[.54,6.31+dy,.22]]:
   [[0,6.49+dy,.62],[-.18,6.43+dy,.637],[-.31,6.25+dy,.56],[-.43,6.20+dy,.39],[-.50,6.27+dy,.22]];
   tendril(b,path,.0145,'headHair',.08);
   if(j%4===0)tendril(b,path.map(q=>[q[0],q[1]+.004,q[2]+.015]),.0026,'hairSheen');
  }
 }
 // Full winding beard: a curved body and many fine, individually tapered strands.
 for(let layer=0;layer<3;layer++)for(let j=0;j<54;j++){
  const u=j/53*2-1,x=u*.30,wave=Math.sin(j*1.71+layer)*.026;
  const startY=6.19+Math.abs(u)*.15,depth=.37+layer*.053;
  const len=.78+.30*(1-u*u)-Math.abs(u)*.24+Math.sin(j*.63)*.055;
  const pts=[[x,startY,depth],[x*.85-.055+wave,5.99,depth+.09],[x*.75-.14,5.70,depth+.10],[x*.6-.23,6.18-len+.04,depth-.01],[x*.43-.25,6.18-len,depth-.13]];
  tendril(b,pts,.024,'headHair',.12);
  if(j%3===0)tendril(b,pts.map(q=>[q[0],q[1],q[2]+.022]),.0025,'hairSheen');
 }
 // Rear hair and nape are modeled, so the head remains complete when orbited.
 for(let i=0;i<64;i++){
  const a=i/64*TAU,xx=Math.sin(a)*.46,zz=-.18-Math.abs(Math.cos(a))*.34;
  tendril(b,[[xx,7.13,zz],[xx*1.08,6.67,zz-.035],[xx*.94,6.20,zz-.06],[xx*.65,5.98,zz-.015]],.026,'headHair',.08);
 }
}

export function referenceCrown(b){
 // A compact, tapered openwork crown, with separate rear/side and front tiers.
 b.lathe([[.46,7.08],[.52,7.13],[.53,7.29],[.48,7.36]],'darkGold',[0,0,-.03],[1,1,.88]);
 for(let offset of [0,.105]){
  const p=[];for(let i=0;i<=96;i++){const a=i/96*TAU;p.push([Math.sin(a)*.53,7.10+.16*Math.max(0,Math.cos(a))+offset,Math.cos(a)*.46-.03]);}b.tube(p,.022,'gold',96);
 }

 for(let i=0;i<15;i++){const a=(i-7)*.22;scroll(b,Math.sin(a)*.53,7.215,Math.cos(a)*.46-.02,.058,'gold',i%2?1:-1);}
 // Rear flame silhouettes surround the head; narrow gilt veins keep a carved profile.
 for(let s of [-1,1])for(let j=0;j<3;j++){
  const x=s*(.54+j*.11),y=6.88+j*.14,z=-.18-j*.07;
  const p=[[x,y,z],[x+s*.22,y+.15,z-.02],[x+s*.10,y+.43,z],[x+s*.28,y+.64,z],[x+s*.19,y+.88,z-.04]];
  tendril(b,p,.081-j*.009,'red',.08);tendril(b,p.map(q=>[q[0]+s*.016,q[1],q[2]+.057]),.018,'gold');
 }
 // Three spires and pierced scrollwork, rather than seven broad red blades.
 for(let j=0;j<3;j++){
  const x=(j-1)*.33,base=7.28,height=j===1?1.62:.97,z=j===1?.18:.24;
  const left=[[x-.20,base,z],[x-.27,base+.2,z],[x-.16,base+height*.65,z],[x+.015,base+height,z]];
  const right=[[x+.20,base,z],[x+.25,base+.18,z],[x+.14,base+height*.63,z],[x+.015,base+height,z]];
  tendril(b,left,.045,'gold');tendril(b,right,.045,'gold');
  flame(b,x,base+height*.38,z,.27,height*.57,'gold',-.06);
  for(let k=0;k<(j===1?6:4);k++){scroll(b,x+(k%2?-.10:.09),base+.12+k*.19,z+.04,.105-k*.01,'gold',k%2?1:-1);}
 }
 // Two deep blue cabochons, each with an oval bezel and beaded surround.
 for(const [x,y,z,r] of [[0,7.56,.50,.145],[.04,8.38,.31,.145]]){
  const rim=new THREE.TorusGeometry(r,.023,10,50);b.add(rim,'gold',[x,y,z],[1,1.2,1]);
  b.ball([x,y,z],[r*.88,r*1.09,.071],'crownGem',36);
  for(let j=0;j<20;j++){const a=j*TAU/20;b.ball([x+Math.sin(a)*r*1.20,y+Math.cos(a)*r*1.39,z],[.013,.013,.014],'paleGold',10);}
 }
 for(let s of [-1,1]){
  scroll(b,s*.39,7.41,.39,.13,'gold',s);
  for(let j=0;j<3;j++){const a=s*(.35+j*.37),x=Math.sin(a)*.53,z=Math.cos(a)*.45;
   b.ball([x,7.3+j*.045,z],[.076,.096,.045],'gold');b.ball([x,7.3+j*.045,z+.039],[.046,.067,.032],'crownGem',24);
  }
 }
 b.ball([0,7.25,.495],[.08,.09,.04],'gold');b.ball([0,7.25,.53],[.049,.059,.03],'crownGem',24);
}
