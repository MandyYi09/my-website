import * as THREE from 'three';
const N=256;
function fract(x){return x-Math.floor(x);}
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const h=(a,b)=>fract(Math.sin(a*127.1+b*311.7)*43758.5453);const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (h(ix,iy)*(1-u)+h(ix+1,iy)*u)*(1-v)+(h(ix,iy+1)*(1-u)+h(ix+1,iy+1)*u)*v;}
const palette={headHair:[37,40,33],crownGem:[23,69,80],skin:[79,101,58],eye:[206,190,128],hairSheen:[49,53,41],gold:[195,153,76],paleGold:[225,192,123],darkGold:[104,77,39],jade:[97,137,105],lightJade:[147,180,145],rose:[172,110,90],blue:[22,53,65],red:[134,48,33],ink:[27,30,26],ivory:[192,183,145],gem:[39,125,108],pearl:[169,194,148]};
function texture(data){const t=new THREE.DataTexture(data,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
export function textureMaterials(materials){
 for(const [name,m] of Object.entries(materials)){
  const data=new Uint8Array(N*N*4),height=new Float32Array(N*N),base=palette[name],stone=['jade','lightJade','rose','pearl'].includes(name),metal=name.toLowerCase().includes('gold');
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
   const i=(y*N+x),u=x/N,v=y/N,n=noise(u*14,v*14),fine=noise(u*97,v*97),n2=noise(u*31+4,v*31+8);
   const wav=Math.sin(u*22+v*13+noise(u*5,v*5)*9+n2*.8),vein=Math.pow(Math.max(0,1-Math.abs(wav)/.17),2);
   const f=stone?.77+n*.34+vein*.28:metal?.72+n*.3+fine*.12:.81+n*.18;
   for(let k=0;k<3;k++)data[i*4+k]=Math.min(255,base[k]*f+(stone?vein*24:0));data[i*4+3]=255;
   height[i]=stone?n*.2+vein*.1:metal?fine*.4+n*.25:fine*.06;
  }
  // Fine arabesque embroidery is a true tiled color/normal texture on the robe.
  if(['blue','red','ivory'].includes(name)){
   const dot=(x,y,r)=>{for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){if(xx*xx+yy*yy>r*r)continue;const k=(((Math.round(y+yy)%N+N)%N)*N+(Math.round(x+xx)%N+N)%N);data[k*4]=179;data[k*4+1]=139;data[k*4+2]=76;height[k]=.7;}};
   for(let cy of [64,192])for(let cx of [64,192])for(let side of [-1,1]){
    for(let j=0;j<240;j++){const t=j/239,a=t*Math.PI*3.2,r=45*(1-t*.91);dot(cx+Math.cos(a)*r*side,cy+Math.sin(a)*r,1);}
    for(let j=0;j<100;j++){const t=j/99;dot(cx+side*(t*55-25),cy+52*Math.sin(t*Math.PI),1);}
   }
  }
  const normal=new Uint8Array(N*N*4);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;const dx=height[y*N+(x+1)%N]-height[y*N+(x+N-1)%N],dy=height[((y+1)%N)*N+x]-height[((y+N-1)%N)*N+x];normal[i*4]=Math.round(128-dx*65);normal[i*4+1]=Math.round(128-dy*65);normal[i*4+2]=250;normal[i*4+3]=255;}
  m.color.set('#ffffff');m.map=texture(data);m.map.colorSpace=THREE.SRGBColorSpace;m.normalMap=texture(normal);m.normalScale.set(metal?.22:.35,metal?.22:.35);m.roughness=metal?.42:stone?.32:.53;
  if(name==='skin'){m.roughness=.63;m.normalScale.set(.12,.12);}
  if(name==='eye'){m.normalScale.set(0,0);m.roughness=.3;}
 }
}
