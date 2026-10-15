// Run the original artwork in an edge-to-edge, camera-free thumbnail.
(() => {
  const originalSetup = window.setup;
  const originalDraw = window.draw;
  let ready = false;
  window.setup = () => {
    pixelDensity(Math.min(devicePixelRatio || 1, 1.5));
    originalSetup();
    frameRate(30);
  };
  window.draw = () => {
    originalDraw();
    if (!ready) {
      ready = true;
      parent.postMessage({ type: 'portfolio-preview', event: 'ready' }, location.origin);
    }
  };
  const originalResize = window.windowResized;
  window.windowResized = () => {
    if (originalResize) originalResize();
    else resizeCanvas(windowWidth, windowHeight);
  };
})();
