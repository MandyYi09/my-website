// Cover-only renderer. The original sketch.js and external project are untouched.
import context from '../render-context.js?v=shapes-1';

const cell = 12, tile = cell + 2;
const atlas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(tile * 3, tile) : document.createElement('canvas');
atlas.width = tile * 3; atlas.height = tile;
const pen = atlas.getContext('2d');
pen.fillStyle = '#fff'; pen.strokeStyle = '#0a0a0a'; pen.lineWidth = 1;
for (let kind = 0; kind < 3; kind++) {
  const x = kind * tile + 1;
  pen.beginPath();
  if (kind === 0) pen.rect(x, 1, cell, cell);
  else if (kind === 1) pen.arc(x + cell / 2, 1 + cell / 2, cell / 2, 0, Math.PI * 2);
  else { pen.moveTo(x + cell / 2, 1); pen.lineTo(x, 1 + cell); pen.lineTo(x + cell, 1 + cell); pen.closePath(); }
  pen.fill(); pen.stroke();
}
const canvas = context.canvas, ctx = canvas.getContext('2d', { alpha: false });
context.resize = () => {
  canvas.width = Math.max(1, Math.round(context.width));
  canvas.height = Math.max(1, Math.round(context.height));
};
context.resize();
function drawFrame() {
  ctx.fillStyle = '#dcdcdc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let x = 0; x < canvas.width; x += cell) {
    for (let y = 0; y < canvas.height; y += cell) {
      const random = Math.random() * 100, kind = random < 33 ? 0 : random < 66 ? 1 : 2;
      ctx.drawImage(atlas, kind * tile, 0, tile, tile, x - 1, y - 1, tile, tile);
    }
  }
}
let handle, previous;
function tick(now) {
  if (context.hidden) { handle = undefined; return; }
  if (previous === undefined || now - previous >= 1000 / (context.fps || 20) - .5) {
    drawFrame(); previous = now;
  }
  handle = requestAnimationFrame(tick);
}
context.visibility = () => {
  if (handle !== undefined) cancelAnimationFrame(handle);
  handle = undefined; previous = undefined;
  if (!context.hidden) handle = requestAnimationFrame(tick);
};
await context.waitUntilVisible();
// Transparent loading frames can suspend rAF, so paint and report outside it.
drawFrame(); context.report({ event: 'ready' }); context.visibility();
