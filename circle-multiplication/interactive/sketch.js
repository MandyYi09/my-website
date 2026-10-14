/* 圆上的乘法：i → (i × m) mod N。p5.js instance mode. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const state = { multiplier: 2, points: 240, palette: 'mint', playing: false };
  const initial = { ...state };
  const palettes = { mint: [137, 26, 85], peach: [25, 43, 96], lavender: [260, 32, 95] };
  const container = $('#canvas-container');
  let sketch;
  let toastTimer;

  function syncControls() {
    for (const name of ['multiplier', 'points']) {
      const input = $(`#${name}`);
      input.value = state[name];
      $(`#${name}-value`).textContent = name === 'multiplier' ? state[name].toFixed(2) : state[name];
      input.style.setProperty('--fill', `${100 * (state[name] - Number(input.min)) / (Number(input.max) - Number(input.min))}%`);
    }
    $('#canvas-equation').textContent = `i → (i × ${state.multiplier.toFixed(2)}) mod ${state.points}`;
    $('#play').setAttribute('aria-pressed', String(state.playing));
    $('#play-icon').textContent = state.playing ? 'Ⅱ' : '▶';
    $('#play-text').textContent = state.playing ? '暂停生长' : '让它生长';
    let title = '自由探索 — 你的数学花园';
    document.querySelectorAll('.preset').forEach((button) => {
      const selected = Math.abs(Number(button.dataset.multiplier) - state.multiplier) < 0.005 && Number(button.dataset.points) === state.points;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
      if (selected) title = button.dataset.title;
    });
    $('#art-title').textContent = title;
    document.querySelectorAll('.swatch').forEach((button) => {
      const selected = button.dataset.palette === state.palette;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    container.setAttribute('aria-label', `乘法连线图：${state.points} 个点，乘数 ${state.multiplier.toFixed(2)}。连线规则为 i 连接到 (i × 乘数) mod ${state.points}。`);
  }

  function update() {
    syncControls();
    if (sketch) {
      if (state.playing) sketch.loop();
      else { sketch.noLoop(); sketch.redraw(); }
    }
  }

  for (const name of ['multiplier', 'points']) {
    $(`#${name}`).addEventListener('input', (event) => {
      state[name] = Number(event.target.value);
      state.playing = false;
      update();
    });
  }
  document.querySelectorAll('.preset').forEach((button) => button.addEventListener('click', () => {
    state.multiplier = Number(button.dataset.multiplier);
    state.points = Number(button.dataset.points);
    state.playing = false;
    update();
  }));
  document.querySelectorAll('.swatch').forEach((button) => button.addEventListener('click', () => {
    state.palette = button.dataset.palette;
    update();
  }));
  $('#play').addEventListener('click', () => { state.playing = !state.playing; update(); });
  $('#reset').addEventListener('click', () => { Object.assign(state, initial); update(); });
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !event.repeat && !event.target.closest('input, button, a, textarea, select, [contenteditable]')) {
      event.preventDefault();
      $('#play').click();
    }
  });
  $('#save').addEventListener('click', () => {
    if (!sketch) return;
    sketch.saveCanvas(`math-garden-m${state.multiplier.toFixed(2)}-n${state.points}`, 'png');
    $('#toast').textContent = '已生成图片，请在浏览器下载中查看';
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
  });

  if (typeof p5 === 'undefined') {
    container.textContent = 'p5.js 加载失败，请确认 vendor/p5.min.js 文件存在后刷新。';
    $('#play').disabled = true;
    $('#save').disabled = true;
    return;
  }

  sketch = new p5((p) => {
    let hover = false;
    let lastTick = 0;
    p.setup = () => {
      const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
      canvas.parent(container);
      canvas.elt.setAttribute('aria-hidden', 'true');
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.colorMode(p.HSB, 360, 100, 100, 1);
      p.frameRate(30);
      p.noLoop();
      new ResizeObserver(() => {
        p.resizeCanvas(container.clientWidth, container.clientHeight);
        if (!state.playing) p.redraw();
      }).observe(container);
      container.addEventListener('pointermove', () => { hover = true; if (!state.playing) p.redraw(); });
      container.addEventListener('pointerleave', () => { hover = false; if (!state.playing) p.redraw(); });
      syncControls();
    };

    p.draw = () => {
      const now = performance.now();
      if (state.playing && lastTick) {
        state.multiplier += Math.min((now - lastTick) / 1000, 0.1) * 0.16;
        if (state.multiplier > 100) state.multiplier = 0;
        syncControls();
      }
      lastTick = now;
      p.background('#141d1a');
      const cx = p.width / 2, cy = p.height / 2;
      const radius = Math.max(30, Math.min(p.width, p.height) * 0.405);
      const pos = (index) => {
        const angle = index / state.points * p.TWO_PI - p.HALF_PI;
        return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
      };
      // Faint plotting guides frame the mathematical construction.
      p.stroke(130, 12, 55, 0.08);
      p.strokeWeight(1);
      for (let x = cx % 32; x < p.width; x += 32) for (let y = cy % 32; y < p.height; y += 32) p.point(x, y);
      p.noFill();
      p.stroke(120, 15, 70, 0.09);
      p.circle(cx, cy, radius * 2 + 28);
      p.line(cx - radius - 28, cy, cx + radius + 28, cy);
      p.line(cx, cy - radius - 28, cx, cy + radius + 28);
      p.stroke(130, 13, 70, 0.28);
      p.circle(cx, cy, radius * 2);
      p.strokeWeight(0.8);
      const opacity = p.map(state.points, 20, 600, 0.65, 0.23);
      for (let i = 0; i < state.points; i++) {
        const a = pos(i), b = pos((i * state.multiplier) % state.points);
        const color = state.palette === 'rainbow' ? [i / state.points * 300, 40, 95] : palettes[state.palette];
        p.stroke(...color, opacity);
        p.line(...a, ...b);
      }
      p.noStroke();
      p.fill(100, 17, 83, state.points > 300 ? 0.4 : 0.7);
      for (let i = 0; i < state.points; i++) p.circle(...pos(i), state.points > 100 ? 1.8 : 3.5);
      p.fill(115, 10, 65, 0.7);
      p.textFont('monospace');
      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('0', cx, cy - radius - 14);
      p.text(state.points / 2, cx, cy + radius + 15);

      // Highlight the nearest source point only when the pointer is near the ring.
      const distance = Math.hypot(p.mouseX - cx, p.mouseY - cy);
      if (hover && Math.abs(distance - radius) < 30) {
        const angle = (Math.atan2(p.mouseY - cy, p.mouseX - cx) + p.HALF_PI + p.TWO_PI) % p.TWO_PI;
        const index = Math.round(angle / p.TWO_PI * state.points) % state.points;
        const target = (index * state.multiplier) % state.points;
        const a = pos(index), b = pos(target);
        p.stroke(55, 30, 100, 1); p.strokeWeight(2); p.line(...a, ...b);
        p.noStroke(); p.fill(55, 30, 100); p.circle(...a, 7); p.circle(...b, 7);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(`${index} × ${state.multiplier.toFixed(2)} mod ${state.points} = ${Number(target.toFixed(2))}`, cx, p.height - 5);
      }
    };
  });
})();
