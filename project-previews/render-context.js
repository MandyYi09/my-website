// Shared by the worker renderers and their compatibility fallback.
const inWorker = typeof document === 'undefined';
let context;
const visibleWaiters = new Set();
function setHidden(hidden) {
  context.hidden = hidden;
  context.visibility?.();
  if (!hidden) { visibleWaiters.forEach(resolve => resolve()); visibleWaiters.clear(); }
}
if (inWorker) {
  context = await new Promise(resolve => {
    const initialize = event => {
      if (event.data?.type !== 'initialize') return;
      self.removeEventListener('message', initialize);
      resolve(event.data);
    };
    self.addEventListener('message', initialize);
  });
  context.hidden = Boolean(context.hidden);
  self.addEventListener('message', event => {
    if (event.data?.type === 'resize') {
      context.width = event.data.width;
      context.height = event.data.height;
      context.resize?.();
    } else if (event.data?.type === 'budget') {
      context.fps = event.data.fps;
    } else if (event.data?.type === 'visibility') {
      setHidden(event.data.hidden);
    }
  });
} else {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', document.title);
  document.body.append(canvas);
  let parentPaused = Boolean(window.__portfolioPreviewPaused);
  context = { canvas, width: innerWidth, height: innerHeight, hidden: document.hidden || parentPaused, fps: window.__portfolioPreviewFPS || 20 };
  window.addEventListener('portfolio-preview-budget', event => { context.fps = event.detail.fps; });
  new ResizeObserver(() => {
    context.width = innerWidth;
    context.height = innerHeight;
    context.resize?.();
  }).observe(document.body);
  document.addEventListener('visibilitychange', () => {
    setHidden(document.hidden || parentPaused);
  });
  window.addEventListener('portfolio-preview-visibility', event => { parentPaused = event.detail.hidden; setHidden(document.hidden || parentPaused); });
}
context.waitUntilVisible = () => context.hidden ? new Promise(resolve => visibleWaiters.add(resolve)) : Promise.resolve();
context.report = data => {
  const message = { type: 'portfolio-preview', ...data };
  if (inWorker) self.postMessage(message);
  else parent.postMessage(message, location.origin);
};
export default context;
