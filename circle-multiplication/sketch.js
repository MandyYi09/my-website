/* Circle multiplication: i → (i × m) mod N. p5.js instance mode. */
(() => {
  'use strict';

  const container = document.querySelector('#canvas-container');
  const coverMode = new URLSearchParams(location.search).get('embed') === '1';

  new p5((p) => {
    const palettes = [
      [137, 26, 85],
      [25, 43, 96],
      [260, 32, 95],
      null // Rainbow: each source point has its own hue.
    ];
    let points;
    let multiplier;
    let speed;
    let palette;
    let sources;
    let lastTick;
    let coverReady = false;
    let rotation = 0;

    p.setup = () => {
      // One fresh seed per load determines the starting composition and pace.
      const seed = window.crypto.getRandomValues(new Uint32Array(1))[0];
      p.randomSeed(seed);
      points = coverMode ? 480 : Math.floor(p.random(240, 601));
      multiplier = coverMode ? 17.2 : p.random(2, 100);
      speed = coverMode ? .18 : p.random(0.12, 0.22);
      palette = coverMode ? null : p.random(palettes);
      sources = Array.from({ length: points }, (_, i) => {
        const angle = i / points * p.TWO_PI - p.HALF_PI;
        return [Math.cos(angle), Math.sin(angle)];
      });

      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
      canvas.parent(container);
      canvas.elt.setAttribute('aria-hidden', 'true');
      p.colorMode(p.HSB, 360, 100, 100, 1);
      p.frameRate(coverMode ? 30 : 60);

      new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width !== p.width || height !== p.height) {
          p.resizeCanvas(width, height);
        }
      }).observe(container);

      // Resume from the same composition after a background-tab pause.
      document.addEventListener('visibilitychange', () => {
        lastTick = undefined;
      });
    };

    p.draw = () => {
      const now = performance.now();
      if (lastTick !== undefined) {
        const elapsed = Math.min((now - lastTick) / 1000, 0.1);
        // N is an exact period of the construction: wrapping here is seamless.
        multiplier = (multiplier + elapsed * speed) % points;
        if (coverMode) rotation += elapsed * .12;
      }
      lastTick = now;

      p.background('#141d1a');
      const cx = p.width / 2;
      const cy = p.height / 2;
      const radius = Math.min(p.width, p.height) * 0.485;
      p.push();
      p.translate(cx, cy);
      p.rotate(rotation);
      p.translate(-cx, -cy);
      const pos = (index) => {
        const angle = index / points * p.TWO_PI - p.HALF_PI;
        return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
      };

      p.noFill();
      p.stroke(130, 13, 70, 0.28);
      p.strokeWeight(1);
      p.circle(cx, cy, radius * 2);

      p.strokeWeight(0.8);
      const opacity = coverMode ? .48 : p.map(points, 20, 600, 0.65, 0.23);
      for (let i = 0; i < points; i++) {
        const [x, y] = sources[i];
        const target = pos((i * multiplier) % points);
        const color = palette || [i / points * 300, coverMode ? 55 : 40, 95];
        p.stroke(...color, opacity);
        p.line(cx + x * radius, cy + y * radius, ...target);
      }

      p.noStroke();
      p.fill(100, 17, 83, points > 300 ? 0.4 : 0.7);
      for (const [x, y] of sources) {
        p.circle(cx + x * radius, cy + y * radius, 1.8);
      }
      p.pop();
      if (!coverReady && coverMode) {
        coverReady = true;
        parent.postMessage({ type: 'portfolio-preview', event: 'ready' }, location.origin);
      }
    };
  });
})();
