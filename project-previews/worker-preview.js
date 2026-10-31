// Keep the iframe's main thread limited to sizing, status and visibility.
const script = document.querySelector('script[data-renderer]');
const entry = new URL(script.dataset.renderer, document.baseURI);
const canUseWorker = typeof Worker === 'function' && typeof OffscreenCanvas === 'function' &&
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';
const report = data => parent.postMessage({ type: 'portfolio-preview', ...data }, location.origin);
let parentPaused = Boolean(window.__portfolioPreviewPaused);
if (canUseWorker) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', document.title);
  document.body.append(canvas);
  let worker;
  let stopped = false;
  const fail = () => {
    if (stopped) return;
    stopped = true;
    worker?.terminate();
    report({ event: 'error' });
  };
  try {
    worker = new Worker(entry, { type: 'module', name: 'portfolio-' + script.dataset.renderer.split('/').slice(-2, -1)[0] });
    worker.addEventListener('message', event => {
      const data = event.data;
      if (stopped || data?.type !== 'portfolio-preview' || !['ready', 'progress', 'error'].includes(data.event)) return;
      if (data.event === 'error') fail();
      else report(data);
    });
    worker.addEventListener('error', fail);
    worker.addEventListener('messageerror', fail);
    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage({ type: 'initialize', canvas: offscreen, width: innerWidth, height: innerHeight, hidden: document.hidden || parentPaused, fps: window.__portfolioPreviewFPS || 20 }, [offscreen]);
    window.addEventListener('portfolio-preview-budget', event => {
      if (!stopped) worker.postMessage({ type: 'budget', fps: event.detail.fps });
    });
    const resize = new ResizeObserver(() => {
      if (!stopped) worker.postMessage({ type: 'resize', width: innerWidth, height: innerHeight });
    });
    resize.observe(document.body);
    document.addEventListener('visibilitychange', () => {
      if (!stopped) worker.postMessage({ type: 'visibility', hidden: document.hidden || parentPaused });
    });
    window.addEventListener('portfolio-preview-visibility', event => {
      parentPaused = event.detail.hidden;
      if (!stopped) worker.postMessage({ type: 'visibility', hidden: document.hidden || parentPaused });
    });
    window.addEventListener('pagehide', () => { resize.disconnect(); stopped = true; worker.terminate(); }, { once: true });
  } catch { fail(); }
} else {
  // Older browsers retain the existing live preview when offscreen rendering
  // is unavailable. A failed worker keeps the static cover rather than retrying
  // expensive initialization on the browsing thread.
  import(entry.href).catch(() => report({ event: 'error' }));
}
