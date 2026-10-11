(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const sceneLanguage = new URLSearchParams(location.search).get('lang') === 'zh-TW' ? 'zh-TW' : 'en';
  document.documentElement.lang = sceneLanguage === 'en' ? 'en' : 'zh-Hant';
  if (sceneLanguage === 'zh-TW') {
    $('#scene-index').textContent = '雲 庭 · 一';
    $('#scene-poem').textContent = '雲起時 · 萬象生';
    $('#scene-poem').classList.remove('is-english');
    $('#loading-seal').textContent = '雲';
  }
  const canvas = $('#scene'), ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1200, height = 600, dpr = 1, time = 0, last = 0, paused = reducedMotion.matches, wind = .35;
  let pointer = { x: 0, y: 0, active: false }, drag = null, hovered = -1, particles = [], ripples = [];
  let sound = false, audio = null, master = null, nextNote = 0, toastTimer, ready = false;
  const palette = ['#b1d9ad', '#dfd66d', '#d58a95', '#89c8b4'];
  // The masks below are drawn in source-image coordinates. The source files
  // remain untouched; individual paintings become flexible, textured puppets.
  const guardians = [
    { name: 'Figure I', message: 'Look at the face.', file: 'guardian-celestial.jpg', color: '#cadfe0', x: .235, y: .59, size: .79, phase: 2,
      bounds: [100, 250, 865, 1580],
      outline: 'M350 251 L369 250 L377 335 L379 374 L410 357 L418 410 L408 451 L380 431 L384 584 L421 539 L432 490 L454 474 L449 513 L425 565 L483 569 L523 543 L543 496 L582 462 L592 480 L560 526 L600 605 L607 684 L635 710 L681 716 L671 611 L648 587 L636 549 L617 514 L629 500 L650 508 L650 458 L679 428 Q750 397 778 455 L784 490 L801 493 L817 512 L798 547 L787 578 L761 614 L782 704 L780 765 L802 790 L847 796 L862 821 L824 838 L810 867 L839 904 L825 949 L796 966 L812 1028 L865 978 L899 1005 L865 1062 L820 1117 L782 1163 L797 1239 L771 1307 L762 1413 L817 1459 L832 1490 L789 1504 L796 1609 L756 1656 L724 1677 L732 1706 L784 1731 L798 1772 L766 1807 L725 1809 L631 1773 L604 1739 L622 1690 L605 1595 L589 1531 L549 1522 L509 1505 L467 1467 L437 1519 L422 1603 L402 1654 L411 1693 L386 1759 L357 1796 L305 1821 L265 1805 L260 1777 L301 1731 L320 1691 L313 1654 L339 1565 L342 1464 L299 1479 L278 1451 L285 1345 L252 1330 L259 1259 L280 1171 L269 1123 L227 1097 L201 1039 L204 981 L229 915 L209 843 L218 795 L172 784 L148 753 L158 710 L186 668 L206 601 L206 565 L180 528 L165 481 L185 477 L201 446 L220 440 Q280 397 317 443 L331 487 L344 498 L352 457 L340 452 L343 442 L348 390 L308 403 L307 372 L299 344 L296 309 L319 329 L331 372 L350 375 Z',
      holes: ['M381 453 L381 542 L420 526 L424 503 L416 522 L396 551 L382 568 Z', 'M302 584 L330 580 L342 551 L342 694 L297 717 L282 692 Z', 'M593 591 L622 553 L633 582 L646 611 L657 706 L610 688 Z'] },
    { name: 'Figure II', message: 'Look at the robe.', file: 'guardian-jade.jpg', color: '#bee5a6', x: .50, y: .56, size: .91, phase: 0,
      bounds: [171, 455, 850, 1350],
      outline: 'M382 587 L400 546 L455 499 L492 488 L510 456 L535 477 L553 475 L608 493 L651 500 L675 538 L674 608 L626 640 L622 671 L670 671 L701 693 L746 697 L773 739 L782 810 L774 873 L788 957 L809 1016 L844 1028 L858 1064 L856 1094 L880 1104 L951 1145 L1003 1194 L981 1221 L914 1183 L849 1144 L822 1110 L815 1167 L842 1224 L880 1299 L867 1344 L828 1374 L821 1465 L788 1527 L777 1616 L779 1682 L837 1717 L860 1738 L826 1771 L751 1756 L710 1732 L680 1733 L681 1701 L692 1638 L674 1587 L671 1502 L639 1515 L609 1503 L584 1436 L566 1381 L559 1290 L511 1218 L464 1241 L444 1323 L481 1394 L482 1444 L463 1534 L458 1581 L436 1659 L455 1712 L422 1766 L379 1792 L327 1785 L338 1740 L362 1714 L369 1660 L371 1594 L336 1524 L315 1491 L314 1454 L318 1368 L294 1316 L303 1235 L342 1168 L316 1147 L280 1156 L268 1133 L265 1099 L249 1084 L247 1038 L217 1005 L202 954 L195 922 L173 905 L179 870 L211 836 L224 781 L260 753 L310 757 L350 716 L406 692 L415 659 L379 614 L317 622 L261 584 L226 547 L249 539 L305 581 L365 616 Z',
      holes: [] },
    { name: 'Figure III', message: 'Look at the object.', file: 'guardian-flame.jpg', color: '#f4c86e', x: .765, y: .60, size: .79, phase: 4,
      bounds: [173, 410, 710, 1435],
      outline: 'M373 556 L393 497 L384 449 L399 414 L412 411 L406 448 L430 482 L425 525 L454 536 L479 543 L479 506 L464 484 L478 476 L497 508 L502 554 L540 509 L537 550 L566 601 L567 665 L546 695 L605 690 L630 686 L650 653 L633 617 Q592 578 620 521 Q653 431 719 444 Q797 456 802 527 Q809 581 771 622 L741 650 L745 690 L739 751 L728 805 L775 799 L817 512 L828 450 L857 446 L836 576 L807 786 L777 912 L784 949 L749 984 L772 1019 L778 1098 L827 1156 L794 1222 L794 1315 L760 1371 L739 1473 L753 1556 L720 1627 L728 1669 L709 1695 L717 1718 L746 1751 L741 1770 L687 1767 L655 1742 L642 1708 L647 1685 L626 1647 L617 1607 L631 1552 L611 1496 L617 1440 L550 1399 L505 1353 L465 1382 L447 1480 L438 1529 L429 1602 L417 1653 L391 1685 L414 1722 L402 1759 L359 1794 L307 1794 L309 1764 L342 1722 L331 1685 L339 1614 L327 1575 L311 1527 L313 1454 L301 1407 L298 1380 L273 1324 L300 1239 L311 1175 L290 1137 L303 1099 L270 1061 L238 1045 L225 997 L190 1004 L174 971 L188 934 L209 910 L222 867 L243 836 L273 813 L316 802 L321 767 L285 747 L275 722 L309 702 L346 710 L375 692 L363 669 L355 620 Z',
      holes: ['M776 610 L797 588 L767 797 L745 798 L758 731 Z'] }
  ];
  function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  const random = seeded(482);
  const stars = Array.from({length: 65}, () => ({x:random(), y:random(), r:random()*1.3+.4, phase:random()*TAU}));
  const strokes = Array.from({length: 90}, () => ({x:random(), y:random(), w:random()*.27+.06, h:random()*3+1, c:random()}));
  const clouds = Array.from({length: 21}, (_, i) => ({x:random()*1.3-.15, y:i<10 ? random()*.45-.1 : .63+random()*.44, size:.12+random()*.14, color:i%4, speed:(random()-.5)*.009, phase:random()*TAU, front:i>16}));
  function makeCloud(color) {
    const c=document.createElement('canvas'); c.width=480;c.height=270;const g=c.getContext('2d');
    const shape=new Path2D('M49 197 C-13 192 1 144 43 140 C9 107 48 67 87 82 C78 36 137 14 172 50 C179 -1 262 -3 279 46 C317 11 372 42 365 79 C425 56 463 93 438 123 C501 137 478 185 441 188 C457 220 390 242 353 223 C334 273 255 254 240 230 C200 270 137 251 131 224 C93 245 53 226 49 197 Z');
    let grad=g.createLinearGradient(0,0,0,265);grad.addColorStop(0,color);grad.addColorStop(.5,color);grad.addColorStop(1,['#599c80','#b09c4a','#9e536c','#408e83'][palette.indexOf(color)]);g.fillStyle=grad;g.fill(shape);g.strokeStyle='#233d3bc7';g.lineWidth=2.2;g.stroke(shape);
    g.save();g.clip(shape);g.globalAlpha=.09;const r=seeded(47);for(let i=0;i<15000;i++){g.fillStyle=r()>.5?'#fff3b1':'#10293b';g.fillRect(r()*480,r()*270,r()*2+.4,r()*3+.3);}g.restore();
    g.strokeStyle='#283c3ddd';g.lineWidth=2;g.lineCap='round';
    const lines=['M67 141 C34 116 93 93 121 110 C149 123 114 145 97 129','M88 82 C98 104 136 102 146 84','M166 53 C135 83 184 107 214 87 C247 64 223 45 202 58 C185 71 205 76 213 65','M284 50 C269 79 311 104 333 87','M374 85 C333 96 344 138 375 131 C396 126 385 111 374 117','M439 143 C415 161 381 150 371 172 C362 193 404 198 418 182','M52 180 C91 202 142 166 169 185 C196 206 160 222 145 207','M184 147 C157 117 213 104 244 118 C285 137 244 170 219 153 C206 143 222 132 230 140','M270 200 C238 167 285 145 319 165 C348 184 325 213 299 202 C286 196 296 183 306 188','M87 219 C121 216 124 195 116 184','M196 231 C226 243 249 223 243 209','M288 94 C310 127 343 117 352 105'];
    for(const d of lines)g.stroke(new Path2D(d));return c;
  }
  const cloudTextures=palette.map(makeCloud);
  const paper=document.createElement('canvas');paper.width=256;paper.height=256;
  const pg=paper.getContext('2d'),pd=pg.createImageData(256,256);for(let i=0;i<pd.data.length;i+=4){const n=random()>.5?230:17;pd.data.set([n,n,n,Math.floor(random()*23)],i);}pg.putImageData(pd,0,0);
  const paperPattern=ctx.createPattern(paper,'repeat');
  function loadImage(src) {return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`Could not load ${src}`));im.src=src;});}
  async function init() {
    try {
      await Promise.all(guardians.map(async g=>{
        const im=await loadImage(g.file);const [x,y,w,h]=g.bounds;
        const c=document.createElement('canvas');c.width=w;c.height=h;const p=c.getContext('2d');
        p.translate(-x,-y);p.save();p.clip(new Path2D(g.outline));p.drawImage(im,0,0);p.restore();
        p.globalCompositeOperation='destination-out';for(const path of g.holes)p.fill(new Path2D(path));
        g.texture=c;g.home={x:g.x,y:g.y};g.burst=0;g.box={x:0,y:0,w:0,h:0};
      }));
      ready=true;$('#loading').classList.add('loaded');resize();syncPause();requestAnimationFrame(frame);
    } catch(error) {$('#loading').replaceChildren(Object.assign(document.createElement('p'),{textContent:'The scroll could not open. Please check the assets folder and reload.'}));console.error(error);}
  }
  function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  new ResizeObserver(resize).observe(canvas);
  function cloud(c, foreground=false) {
    let x=((c.x+time*c.speed*(.1+wind))%1.5+1.5)%1.5-.25;
    const w=Math.max(width*c.size,145)*(foreground?1.25:1),h=w*.56;
    const parallax=pointer.active?(pointer.x-width/2)*.014*(foreground?2:1):0;
    const y=c.y*height+Math.sin(time*.35+c.phase)*7*(.3+wind);
    ctx.save();ctx.globalAlpha=foreground?.97:.76;ctx.translate(x*width+parallax,y);ctx.rotate(Math.sin(c.phase)*.11);ctx.drawImage(cloudTextures[c.color],-w/2,-h/2,w,h);ctx.restore();
  }
  function sky(){
    const gradient=ctx.createLinearGradient(0,0,0,height);gradient.addColorStop(0,'#17334b');gradient.addColorStop(.43,'#246266');gradient.addColorStop(1,'#539d82');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
    for(const s of strokes){const x=((s.x*width+time*(4+wind*12))%(width*1.4))-width*.2;ctx.fillStyle=s.c>.65?'#9ac9a125':s.c>.3?'#071f365e':'#d7da922c';ctx.fillRect(x,s.y*height,width*s.w,s.h);}
    for(const s of stars){const x=s.x*width,y=s.y*height;ctx.globalAlpha=.3+Math.sin(time*.7+s.phase)*.2;ctx.fillStyle='#e5deb0';ctx.beginPath();ctx.arc(x,y,s.r,0,TAU);ctx.fill();}ctx.globalAlpha=1;
    clouds.filter(c=>!c.front).forEach(c=>cloud(c));
  }
  function drawHalo(g,x,y,h){
    const radius=h*.205,pulse=g.burst>0?Math.sin(g.burst*5)*8:0;
    ctx.save();ctx.translate(x,y-h*.26);ctx.rotate(time*.025*(g.phase===0?1:-1));
    const grad=ctx.createRadialGradient(0,0,0,0,0,radius*1.7);grad.addColorStop(0,g.color+'30');grad.addColorStop(1,g.color+'00');ctx.fillStyle=grad;ctx.fillRect(-radius*1.7,-radius*1.7,radius*3.4,radius*3.4);
    ctx.strokeStyle=g.color;ctx.lineWidth=.8;ctx.globalAlpha=.5;for(const r of [radius,radius+6,radius+14]){ctx.beginPath();ctx.arc(0,0,r+pulse,0,TAU);ctx.stroke();}
    for(let i=0;i<36;i++){const a=i/36*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*(radius+17),Math.sin(a)*(radius+17));ctx.lineTo(Math.cos(a)*(radius+(i%3===0?27:21)),Math.sin(a)*(radius+(i%3===0?27:21)));ctx.stroke();}ctx.restore();
  }
  function drawGuardian(g,index){
    const narrow=width/height<1.3;
    const h=Math.min(height*g.size,width*(narrow?(index===1?.96:.73):.48));const w=h*g.texture.width/g.texture.height;
    let x=g.x*width,y=g.y*height+(paused?0:Math.sin(time*(.75+wind*.7)+g.phase)*height*.013);
    if(narrow && !g.moved){x=[.21,.5,.79][index]*width;y=height*[.62,.49,.65][index];}
    const energy=Math.max(0,g.burst),dance=Math.sin((4-energy)*5)*Math.min(energy,1);
    y-=energy>0?Math.sin(Math.min((4-energy)/4,1)*Math.PI)*23:0;
    g.box={x:x-w/2,y:y-h/2,w,h};
    drawHalo(g,x,y,h);
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time*.55+g.phase)*(.016+wind*.012)+dance*.035);
    if(hovered===index || (drag&&drag.index===index)){ctx.shadowColor=g.color;ctx.shadowBlur=14;}
    // Overlapping strips make the head, cloth, and legs flex continuously.
    const strips=76,sh=g.texture.height/strips;
    for(let j=0;j<strips;j++){
      const v=j/strips,flex=Math.sin(v*7-time*(1.1+wind)+g.phase)*(1.6+wind*3.8)*(Math.pow(Math.abs(v-.48)*2,1.5));
      const gesture=energy>0?Math.sin(v*9+(4-energy)*6)*energy*(index===2?1.9:1.2):0;
      const dy=-h/2+j*h/strips;ctx.drawImage(g.texture,0,j*sh,g.texture.width,Math.min(sh+2,g.texture.height-j*sh),-w/2+flex+gesture,dy,w,h/strips+1);
    }
    ctx.restore();
    if(energy>0){ctx.save();ctx.translate(x,y-h*.1);ctx.rotate(time*.6);ctx.strokeStyle=g.color;ctx.globalAlpha=Math.min(energy*.3,.6);ctx.lineWidth=1;ctx.setLineDash([3,11]);ctx.beginPath();ctx.ellipse(0,0,w*.65,h*.5,0,0,TAU);ctx.stroke();ctx.restore();}
  }
  function drawEffects(dt){
    for(const p of particles){if(!paused){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx+=wind*dt*9;p.vy-=dt*3;}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*1.3);ctx.globalAlpha=Math.max(0,Math.min(p.life,.85));ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(0,-p.size);ctx.quadraticCurveTo(p.size*.5,-p.size*.3,p.size,0);ctx.quadraticCurveTo(p.size*.2,p.size*.3,0,p.size);ctx.quadraticCurveTo(-p.size*.3,p.size*.3,-p.size,0);ctx.quadraticCurveTo(-p.size*.4,-p.size*.3,0,-p.size);ctx.fill();ctx.restore();}
    particles=particles.filter(p=>p.life>0);
    for(const r of ripples){if(!paused)r.life-=dt;ctx.globalAlpha=Math.max(0,r.life*.35);ctx.strokeStyle=r.color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(r.x,r.y,(2-r.life)*75+10,(2-r.life)*32+5,0,0,TAU);ctx.stroke();}ripples=ripples.filter(r=>r.life>0);ctx.globalAlpha=1;
  }
  function frame(now){
    const dt=Math.min((now-last)/1000||0,.05);last=now;if(!paused)time+=dt;
    ctx.setTransform(dpr,0,0,dpr,0,0);sky();
    for(const index of [0,2,1]){const g=guardians[index];if(!paused)g.burst=Math.max(0,g.burst-dt);drawGuardian(g,index);}
    clouds.filter(c=>c.front).forEach(c=>cloud(c,true));drawEffects(dt);
    ctx.fillStyle=paperPattern;ctx.fillRect(0,0,width,height);
    if(sound&&!paused&&audio&&audio.currentTime>nextNote){tone([146.83,174.61,196,220,261.63,293.66][Math.floor(random()*6)],.08,3);nextNote=audio.currentTime+2.6+random()*2.5;}
    requestAnimationFrame(frame);
  }
  function announce(message){$('#announcement').textContent=message;$('#announcement').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#announcement').classList.remove('visible'),3100);}
  function emit(x,y,color,count=25){for(let i=0;i<count;i++){const a=random()*TAU,s=20+random()*95;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,color,life:1.5+random()*2.5,size:1+random()*3.3});}if(particles.length>350)particles.splice(0,particles.length-350);}
  function awaken(index){if(!ready)return;const g=guardians[index];g.burst=4;const b=g.box;emit(b.x+b.w/2,b.y+b.h*.35,g.color,55);ripples.push({x:b.x+b.w/2,y:b.y+b.h*.5,color:g.color,life:2});$('#scene-status').textContent=`${g.name.toUpperCase()} AWAKENS`;announce(g.message);const button=$(`[data-guardian="${index}"]`);button.classList.add('active');setTimeout(()=>button.classList.remove('active'),3500);if(sound&&!paused){[1,1.5,2].forEach((n,i)=>tone((index===0?146.83:index===1?196:220)*n,.13,2,i*.15));}}
  function position(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function hit(p){for(const i of [1,2,0]){const b=guardians[i].box;if(b&&p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h)return i;}return -1;}
  canvas.addEventListener('pointerdown',e=>{if(!ready)return;const p=position(e),index=hit(p);pointer={...p,active:true};canvas.setPointerCapture(e.pointerId);if(index>=0){const g=guardians[index];drag={index,start:p,last:p,moved:0,offsetX:p.x-(g.box.x+g.box.w/2),offsetY:p.y-(g.box.y+g.box.h/2)};}else{emit(p.x,p.y,palette[Math.floor(random()*4)],15);ripples.push({...p,color:'#d9e0af',life:2});}});
  canvas.addEventListener('pointermove',e=>{const p=position(e);pointer={...p,active:true};if(drag){const g=guardians[drag.index];drag.moved+=Math.hypot(p.x-drag.last.x,p.y-drag.last.y);drag.last=p;g.x=Math.max(.06,Math.min(.94,(p.x-drag.offsetX)/width));g.y=Math.max(.22,Math.min(.80,(p.y-drag.offsetY)/height));g.moved=true;}else{hovered=hit(p);canvas.style.cursor=hovered>=0?'grab':'crosshair';if(!paused&&random()>.65)emit(p.x,p.y,'#ddd79b',1);}});
  canvas.addEventListener('pointerup',e=>{if(drag&&drag.moved<10)awaken(drag.index);drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
  canvas.addEventListener('pointercancel',()=>{drag=null;});canvas.addEventListener('lostpointercapture',()=>{drag=null;});canvas.addEventListener('pointerleave',()=>{hovered=-1;pointer.active=false;});
  document.querySelectorAll('[data-guardian]').forEach(b=>b.addEventListener('click',()=>awaken(Number(b.dataset.guardian))));
  $('#wind').addEventListener('input',e=>{wind=Number(e.target.value)/100;$('#wind-value').textContent=wind<.1?'Still':wind<.45?'Gentle':wind<.75?'Breezy':'Wild';});
  function syncPause(){const b=$('#pause');b.textContent=paused?'▷':'Ⅱ';b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'Resume animation':'Pause animation');b.title=paused?'Resume animation':'Pause animation';$('#scene-status').textContent=paused?'A MOMENT OF STILLNESS':'THE COURT IS DREAMING';if(master&&audio)master.gain.setTargetAtTime(paused?0:.22,audio.currentTime,.2);}
  function togglePause(){paused=!paused;syncPause();}
  $('#pause').addEventListener('click',togglePause);
  reducedMotion.addEventListener('change',e=>{paused=e.matches;syncPause();});
  function reset(){if(!ready)return;guardians.forEach(g=>{g.x=g.home.x;g.y=g.home.y;g.moved=false;g.burst=0;});particles=[];ripples=[];wind=.35;$('#wind').value=35;$('#wind-value').textContent='Gentle';time=0;syncPause();announce('The figures return. Look again.');}
  $('#reset').addEventListener('click',reset);
  function tone(freq,volume,duration,delay=0){if(!audio||!master)return;const t=audio.currentTime+delay,o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.value=freq;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(gain);gain.connect(master);o.start(t);o.stop(t+duration+.1);o.onended=()=>{o.disconnect();gain.disconnect();};}
  $('#sound').addEventListener('click',async()=>{try{if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');audio=new Audio();master=audio.createGain();master.gain.value=paused?0:.22;master.connect(audio.destination);}sound=!sound;if(sound){await audio.resume();nextNote=0;}else await audio.suspend();$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').setAttribute('aria-label',sound?'Mute ambient sound':'Enable ambient sound');$('#sound').innerHTML=sound?'♫':'♫<span class="off-dot"></span>';announce(sound?'Sound on · a quiet, generative chime':'Sound off');}catch{sound=false;announce('Ambient sound is unavailable in this browser.');}});
  $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('.scroll').requestFullscreen)await $('.scroll').requestFullscreen();else announce('Fullscreen is not supported in this browser.');}catch{announce('Fullscreen is not available in this view.');}});
  document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;$('#fullscreen').setAttribute('aria-label',on?'Exit fullscreen':'Enter fullscreen');});
  const about = { open: false };
  document.addEventListener('keydown',e=>{if(about.open||e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|BUTTON|SELECT|TEXTAREA|A)$/.test(e.target.tagName))return;if(['1','2','3'].includes(e.key))awaken(Number(e.key)-1);else if(e.code==='Space'){e.preventDefault();togglePause();}else if(e.key.toLowerCase()==='r')reset();});
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(audio&&sound){if(document.hidden)audio.suspend();else audio.resume().catch(()=>{});}});
  init();
})();
