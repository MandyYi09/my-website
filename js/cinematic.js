(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const mix = (a, b, n) => a + (b - a) * n;
  const introDuration = 7.4;
  document.querySelectorAll('[data-motion-scene]').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const intro = canvas.dataset.motionScene === 'intro';
    const root = canvas.parentElement;
    let width = 0, height = 0, time = reduce.matches ? introDuration : 0, last = null, frame = 0;
    let paused = reduce.matches, visible = true;
    let finished = reduce.matches;
    const showcase = intro ? document.querySelector('.work-showcase') : null;
    if (intro) {
      root.hidden = finished;
      showcase.inert = !finished;
      document.body.classList.toggle('intro-playing', !finished);
      if (!finished) document.dispatchEvent(new Event('opening-start'));
    }
    function finishIntro() {
      if (!intro || finished) return;
      finished = true; stop();
      root.classList.add('is-leaving'); root.inert = true;
      showcase.inert = false;
      document.body.classList.remove('intro-playing');
      document.dispatchEvent(new Event('opening-complete'));
      setTimeout(() => { if (finished) root.hidden = true; }, reduce.matches ? 0 : 650);
    }
    let pointer = { x: 0, y: 0 };

    function resize() {
      const rect = root.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    function court(t, opacity = 1) {
      ctx.save(); ctx.globalAlpha = opacity;
      const bg = ctx.createRadialGradient(width * .75, height * .4, 0, width * .5, height * .5, width);
      bg.addColorStop(0, '#174e50'); bg.addColorStop(.5, '#0d303a'); bg.addColorStop(1, '#061e29');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(195,220,178,.25)'; ctx.lineWidth = 1.5;
      const cx = width * .73, horizon = height * .16;
      for (const spread of [-.7,-.37,.37,.7]) {
        ctx.beginPath();ctx.moveTo(cx + width * spread * .33,horizon);ctx.lineTo(cx + width * spread,height*1.25);ctx.stroke();
      }
      for (const y of [.16,.35,.58,.91]) {
        const left = cx - width * (.24 + y * .36), right = cx + width * (.24 + y * .36);
        ctx.beginPath();ctx.moveTo(left,height*y);ctx.lineTo(right,height*y);ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(209,226,201,.09)';ctx.lineWidth = .7;
      for(let i=0;i<28;i++){const x=width*.27+i*width*.04;ctx.beginPath();ctx.moveTo(x,height*.46);ctx.lineTo(x,height*.64);ctx.stroke();}
      for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(width*.24,height*(.46+i*.025));ctx.lineTo(width*1.1,height*(.46+i*.025));ctx.stroke();}
      ctx.restore();
    }
    function ball(x,y,r,rotation,opacity=1) {
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=opacity;
      // A shaded felt surface, with the two curved seams of a tennis ball.
      const shade=ctx.createRadialGradient(-r*.4,-r*.45,r*.05,r*.12,r*.15,r*1.18);
      shade.addColorStop(0,'#f3ff9d');shade.addColorStop(.4,'#dce943');shade.addColorStop(.78,'#a9c431');shade.addColorStop(1,'#506b18');
      ctx.shadowColor='#0008';ctx.shadowBlur=r*.4;ctx.shadowOffsetY=r*.18;
      ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.save();ctx.beginPath();ctx.arc(0,0,r*.985,0,Math.PI*2);ctx.clip();
      ctx.strokeStyle='#ecf0cb';ctx.lineWidth=Math.max(2,r*.047);
      for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*r*.98,0,r*.72,r*1.06,side*.13,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='#fbffd319';
      for(let i=0;i<260;i++){const a=i*2.39996, rr=Math.sqrt(i/260)*r;ctx.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,Math.max(.6,r*.009),Math.max(.6,r*.007));}
      ctx.restore();ctx.restore();
    }
    // Deterministic particles keep replay smooth and avoid allocating per frame.
    const spray = Array.from({length:110}, (_,i) => ({
      angle:i*2.39996, speed:.18+(i%17)/32, radius:1.4+(i%6)*.8, delay:(i%9)*.025
    }));
    function splash(t) {
      const age=t-1.96;
      if(age<0 || age>2.8)return;
      const cx=width*.69, cy=height*(width<700?.32:.46);
      ctx.save();
      for(const drop of spray){
        const life=age-drop.delay;if(life<0)continue;
        const travel=life*drop.speed*Math.min(width,850);
        const x=cx+Math.cos(drop.angle)*travel;
        const y=cy+Math.sin(drop.angle)*travel*.72+life*life*height*.13;
        ctx.globalAlpha=clamp(1-life/2.5)*.8;
        ctx.fillStyle=life<.25?'#e7edaf':'#c0ece5';
        ctx.beginPath();ctx.ellipse(x,y,drop.radius,drop.radius*(1+life*1.5),-Math.cos(drop.angle)*.5,0,Math.PI*2);ctx.fill();
      }
      // A crown of curling jets marks the impact before the rising wave.
      ctx.globalAlpha=clamp(1-age/1.2);ctx.strokeStyle='#c6f0df';ctx.lineWidth=2;
      for(let i=0;i<15;i++){
        const a=i*Math.PI*2/15,r=age*Math.min(width,650)*.58;
        ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*.45,cy+Math.sin(a)*r*.3);
        ctx.quadraticCurveTo(cx+Math.cos(a)*r*.85,cy+Math.sin(a)*r*.8-70*age,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.58);ctx.stroke();
      }
      ctx.restore();
    }
    function serve(t,opacity=1) {
      const p=clamp(t/1.96),rush=Math.pow(p,3.8);
      const x=width*(.82-.13*p)+Math.sin(p*Math.PI*2)*width*.075;
      const y=height*(width<700?.24:.3)+Math.sin(p*Math.PI*2)*height*.16+height*.16*p;
      const r=mix(13,Math.min(width*.38,390),rush);
      ctx.save();
      ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,height*.72,r*.8,r*.12,0,0,Math.PI*2);ctx.fill();
      for(let j=7;j>0;j--){
        const lag=clamp(p-j*.028),lr=mix(13,Math.min(width*.38,390),Math.pow(lag,3.8));
        ctx.globalAlpha=(1-j/8)*.16*opacity;ctx.fillStyle='#dae96d';ctx.beginPath();
        ctx.arc(width*(.82-.13*lag)+Math.sin(lag*Math.PI*2)*width*.075,height*(width<700?.24:.3)+Math.sin(lag*Math.PI*2)*height*.16+height*.16*lag,lr,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=opacity*clamp((p-.55)*2);
      ctx.strokeStyle='#e9f2b766';ctx.lineWidth=1;
      for(let i=0;i<28;i++){
        const a=i*2.39996,inner=r+35+(i%4)*18,outer=inner+25+rush*130;
        ctx.beginPath();ctx.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);ctx.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer);ctx.stroke();
      }
      ctx.restore();ball(x,y,r,t*6,opacity);
    }
    function water(t,fill) {
      const top=mix(height*1.2,-height*.2,smooth(fill));
      ctx.save();ctx.beginPath();ctx.moveTo(0,height);
      for(let x=0;x<=width+16;x+=16){const wave=Math.sin(x/width*6.2-t*2.1)*height*.06+Math.sin(x/width*13+t*1.7)*height*.025;ctx.lineTo(x,top+wave);}
      ctx.lineTo(width,height);ctx.closePath();ctx.clip();
      const sea=ctx.createLinearGradient(0,0,width,height);sea.addColorStop(0,'#062431');sea.addColorStop(.48,'#155564');sea.addColorStop(.75,'#206c74');sea.addColorStop(1,'#082f42');
      ctx.fillStyle=sea;ctx.fillRect(0,0,width,height);
      // Long moving surface ripples, varied in scale and light.
      for(let j=0;j<44;j++){
        const base=j/43*height;
        ctx.beginPath();
        for(let x=-15;x<width+20;x+=18){
          const y=base+Math.sin(x/width*7+j*.61+t*.4)*18+Math.sin(x/width*20-j*.7+t*.7)*4;
          if(x===-15)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.strokeStyle=j%5===0?'rgba(166,224,209,.18)':'rgba(111,188,188,.08)';ctx.lineWidth=j%5===0?1.3:.7;ctx.stroke();
      }
      // Flow glints follow the water instead of blinking randomly.
      for(let i=0;i<95;i++){
        const x=((i*137.43+t*10)% (width+70))-35,y=(i*89.91)%height;
        const alpha=.03+.12*Math.pow(Math.sin(i*1.7+t*.4),8);
        ctx.strokeStyle=`rgba(210,243,216,${alpha})`;ctx.lineWidth=.8;
        ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-2,x+17,y);ctx.stroke();
      }
      // Foam travels along the crest, with overlapping translucent wave bands.
      if(fill<1){
        for(let band=0;band<3;band++){
          ctx.strokeStyle=['#d2f0de66','#9cdedc44','#83cad233'][band];ctx.lineWidth=12+band*14;ctx.beginPath();
          for(let x=0;x<=width+16;x+=16){const y=top+Math.sin(x/width*6.2-t*2.1)*height*.06+Math.sin(x/width*13+t*1.7)*height*.025+18+band*24;if(!x)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
        }
        for(let i=0;i<80;i++){
          const x=(i*79.31+t*45)%width;
          const y=top+Math.sin(x/width*6.2-t*2.1)*height*.06+Math.sin(x/width*13+t*1.7)*height*.025+6+(i%5)*5;
          ctx.fillStyle='#e1f7df88';ctx.beginPath();ctx.ellipse(x,y,2+i%4,1.5,0,0,Math.PI*2);ctx.fill();
        }
      }
      // The front edge of the incoming surge.
      if(fill<1){
        ctx.strokeStyle='#b0ded77a';ctx.lineWidth=2;ctx.beginPath();
        for(let x=0;x<=width+16;x+=16){const y=top+Math.sin(x/width*6.2-t*2.1)*height*.06+Math.sin(x/width*13+t*1.7)*height*.025+4;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
        ctx.stroke();
      }
      ctx.restore();
    }
    function boat(t,arrival) {
      const mobile=width<700;
      const x=mix(width*1.25,width*(mobile?.69:.73),smooth(arrival))+pointer.x*9;
      const y=height*(mobile?.30:.56)-smooth((t-5.3)/2)*height*.12+Math.sin(t*2.2)*4+pointer.y*6;
      const scale=Math.min(mobile?width/740:width/1500,1.1);
      ctx.save();ctx.translate(x,y);ctx.rotate(-.45+Math.sin(t*2.2)*.025);ctx.scale(scale,scale);ctx.globalAlpha=smooth(arrival);
      // Wake: nested V shapes, spreading behind the narrow shell.
      for(let i=0;i<8;i++){
        ctx.strokeStyle=`rgba(189,231,216,${.15-i*.016})`;ctx.lineWidth=1;
        const drift=(t*14+i*24)%180;
        ctx.beginPath();ctx.moveTo(-15-drift*.28,140+drift);ctx.quadraticCurveTo(0,130+drift,15+drift*.28,140+drift);ctx.stroke();
      }
      ctx.shadowColor='#001d2aa0';ctx.shadowBlur=20;ctx.shadowOffsetX=13;ctx.shadowOffsetY=15;
      ctx.fillStyle='#c8c78a';ctx.beginPath();ctx.moveTo(0,-204);ctx.bezierCurveTo(33,-114,30,100,0,212);ctx.bezierCurveTo(-30,100,-33,-114,0,-204);ctx.fill();
      ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
      ctx.fillStyle='#eee9c7';ctx.beginPath();ctx.moveTo(0,-193);ctx.bezierCurveTo(17,-110,22,106,0,193);ctx.bezierCurveTo(-20,101,-16,-111,0,-193);ctx.fill();
      ctx.fillStyle='#263f43';ctx.fillRect(-15,-42,30,123);ctx.strokeStyle='#9cac91';ctx.lineWidth=2;ctx.strokeRect(-11,-31,22,101);
      const stroke=Math.sin(t*2.2)*.38;
      for(const side of [-1,1]){
        ctx.save();ctx.translate(side*23,8);ctx.rotate(side*stroke);
        ctx.strokeStyle='#b9c3b4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*53,-12);ctx.lineTo(side*55,15);ctx.stroke();
        ctx.strokeStyle='#283c3c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-side*15,18);ctx.lineTo(side*157,-52);ctx.stroke();
        ctx.fillStyle='#e2e4ba';ctx.beginPath();ctx.moveTo(side*141,-50);ctx.lineTo(side*183,-69);ctx.lineTo(side*190,-51);ctx.lineTo(side*148,-37);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#cbf0d044';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(side*173,-53,25,8,-side*.4,0,Math.PI);ctx.stroke();ctx.restore();
      }
      // Oar splashes and widening ripples follow each stroke.
      for(const side of [-1,1]){
        for(let i=0;i<14;i++){
          const life=(t*1.05+i/14)%1;
          ctx.globalAlpha=smooth(arrival)*(1-life)*.65;
          ctx.fillStyle='#d4eee3';ctx.beginPath();
          ctx.arc(side*(164+life*35+Math.sin(i*7)*life*17),-40+life*65+Math.cos(i*4)*life*16,1.2+life*1.5,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.globalAlpha=smooth(arrival);
      // Rower, seen from above: legs, pale jersey, arms and head.
      ctx.strokeStyle='#183038';ctx.lineWidth=10;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-7,48);ctx.lineTo(-10,14);ctx.lineTo(-7,-13);ctx.moveTo(7,48);ctx.lineTo(10,14);ctx.lineTo(7,-13);ctx.stroke();
      ctx.fillStyle='#eff0d9';ctx.beginPath();ctx.ellipse(0,53,14,24,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#c49b78';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-11,47);ctx.lineTo(-23,27+stroke*15);ctx.lineTo(-8,15);ctx.moveTo(11,47);ctx.lineTo(23,27+stroke*15);ctx.lineTo(8,15);ctx.stroke();
      ctx.fillStyle='#322f27';ctx.beginPath();ctx.ellipse(0,73,10,12,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    function draw() {
      if(!width||!height)return;
      ctx.clearRect(0,0,width,height);
      court(time);
      if(!intro){ball(width*.73,height*.48,Math.min(width*.15,125),time*.25);return;}
      if(time<2.35)serve(time,time>2?1-clamp((time-2)/.35):1);
      if(time>1.9&&time<3.2){
        const p=(time-1.9)/1.3;
        ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle='#e7ef9977';
        for(let i=0;i<3;i++){ctx.lineWidth=1+i;ctx.beginPath();ctx.ellipse(width*.68,height*.48,(p*width*.7)+i*22,(p*width*.5)+i*18,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
      }
      if(time>2.05)water(time,clamp((time-2.05)/2.9));
      splash(time);
      if(time>4.2)boat(time,clamp((time-4.2)/1.7));
    }
    function tick(now) {
      frame=0;
      if(last!==null)time+=Math.min((now-last)/1000,.06);
      last=now;draw();
      if(intro && time >= introDuration) { finishIntro(); return; }
      if(!paused&&visible&&!document.hidden&&!(intro&&finished))frame=requestAnimationFrame(tick);
    }
    function start(){if(!frame&&!paused&&visible&&!document.hidden&&!(intro&&finished)){last=null;frame=requestAnimationFrame(tick);}}
    function stop(){cancelAnimationFrame(frame);frame=0;last=null;}
    new ResizeObserver(resize).observe(root);
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();else stop();},{threshold:.01}).observe(root);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
    root.addEventListener('pointermove',event=>{const r=root.getBoundingClientRect();pointer={x:(event.clientX-r.left)/r.width-.5,y:(event.clientY-r.top)/r.height-.5};},{passive:true});
    reduce.addEventListener('change',event=>{paused=event.matches;if(paused){time=introDuration;stop();draw();if(intro)finishIntro();}else start();});
    if (!intro) {
      const control = root.querySelector('.sports-motion-toggle');
      const updateControl = () => {
        control.textContent = paused ? '▶ Resume motion' : 'Ⅱ Pause motion';
        control.setAttribute('aria-label', paused ? 'Resume court animation' : 'Pause court animation');
      };
      if (control) {
        updateControl();
        control.addEventListener('click', () => { paused = !paused; if (paused) stop(); else start(); updateControl(); });
        reduce.addEventListener('change', updateControl);
      }
    }
    if(intro){
      function restartIntro() {
        finished=false; root.hidden=false; root.inert=false; root.classList.remove('is-leaving');
        showcase.inert=true; document.body.classList.add('intro-playing');
        document.dispatchEvent(new Event('opening-start'));
        time=0;paused=false;visible=true;resize();start();
      }
      window.addEventListener('pageshow',event=>{if(event.persisted&&!reduce.matches)restartIntro();});
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!finished)finishIntro();});
      // A stable final scene remains available if motion is reduced.
      window.addEventListener('pagehide',stop);
    }
    resize();start();
  });
})();
