// Installed only in local gallery frames. Keep the document/canvas state, but
// suspend animation callbacks, timers, media and CSS animation while offscreen.
(() => {
  if (window === parent || window.__portfolioLifecycle || location.origin === 'null') return;
  window.__portfolioLifecycle = true;
  const lifecycleURL = document.currentScript.src;
  const native = {
    raf: requestAnimationFrame.bind(window), cancelRaf: cancelAnimationFrame.bind(window),
    timeout: setTimeout.bind(window), clear: clearTimeout.bind(window)
  };
  let frozen = false, serial = 1000000000;
  const frames = new Map(), timers = new Map(), media = new Set(), animations = new Set();
  const armFrame = (id, record) => {
    record.native = native.raf(time => { frames.delete(id); record.callback(time); });
  };
  window.requestAnimationFrame = callback => {
    const id = ++serial, record = { callback };
    frames.set(id, record); if (!frozen) armFrame(id, record); return id;
  };
  window.cancelAnimationFrame = id => {
    const record = frames.get(id);
    if (record) { native.cancelRaf(record.native); frames.delete(id); }
    else native.cancelRaf(id);
  };
  const armTimer = (id, record) => {
    record.deadline = performance.now() + record.remaining;
    record.native = native.timeout(() => {
      if (!record.interval) timers.delete(id);
      if (typeof record.callback === 'function') record.callback(...record.args);
      else window.eval(String(record.callback));
      if (record.interval && timers.has(id)) { record.remaining = record.delay; if (!frozen) armTimer(id, record); }
    }, record.remaining);
  };
  const timer = (callback, delay, interval, args) => {
    const id = ++serial;
    const record = { callback, args, delay: Math.max(0, Number(delay) || 0), interval };
    record.remaining = record.delay; timers.set(id, record); if (!frozen) armTimer(id, record); return id;
  };
  window.setTimeout = (callback, delay, ...args) => timer(callback, delay, false, args);
  window.setInterval = (callback, delay, ...args) => timer(callback, delay, true, args);
  window.clearTimeout = window.clearInterval = id => {
    const record = timers.get(id);
    if (record) { native.clear(record.native); timers.delete(id); }
    else native.clear(id);
  };
  function setFrozen(value) {
    if (frozen === value) return;
    frozen = value; window.__portfolioPreviewPaused = value;
    document.documentElement.toggleAttribute('data-preview-paused', value);
    if (value) {
      for (const record of frames.values()) native.cancelRaf(record.native);
      for (const record of timers.values()) {
        native.clear(record.native); record.remaining = Math.max(0, record.deadline - performance.now()) || record.delay;
      }
      document.querySelectorAll('video,audio').forEach(element => { if (!element.paused) { media.add(element); element.pause(); } });
      document.getAnimations().forEach(animation => { if (animation.playState === 'running') { animations.add(animation); animation.pause(); } });
    } else {
      for (const [id, record] of frames) armFrame(id, record);
      for (const [id, record] of timers) armTimer(id, record);
      media.forEach(element => element.play().catch(() => {})); media.clear();
      animations.forEach(animation => animation.play()); animations.clear();
    }
    window.dispatchEvent(new CustomEvent('portfolio-preview-visibility', { detail: { hidden: value } }));
    document.querySelectorAll('iframe').forEach(frame => {
      try { frame.contentWindow.postMessage({ type: 'portfolio-lifecycle', paused: value }, new URL(frame.src, location.href).origin); } catch {}
    });
  }
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.data?.event === 'lifecycle-ready') {
      const child = [...document.querySelectorAll('iframe')].find(frame => frame.contentWindow === event.source);
      if (child) child.contentWindow.postMessage({ type: 'portfolio-lifecycle', paused: frozen }, location.origin);
      return;
    }
    if (event.source !== parent || event.origin !== location.origin) return;
    if (event.data?.type === 'portfolio-budget') {
      window.__portfolioPreviewFPS = Math.max(10, Math.min(30, Number(event.data.fps) || 20));
      window.dispatchEvent(new CustomEvent('portfolio-preview-budget', { detail: { fps: window.__portfolioPreviewFPS } }));
      return;
    }
    if (event.data?.type !== 'portfolio-lifecycle') return;
    setFrozen(Boolean(event.data.paused));
  });
  // Freeze videos that finish buffering after the document has already paused.
  document.addEventListener('play', event => { if (frozen) { media.add(event.target); event.target.pause(); } }, true);
  const nested = new WeakSet();
  function watchChildren() {
    document.querySelectorAll('iframe').forEach(frame => {
      if (nested.has(frame)) return;
      nested.add(frame);
      frame.addEventListener('load', () => {
        try {
          const doc = frame.contentDocument;
          if (!doc || doc.querySelector('script[data-preview-lifecycle]')) return;
          const script = doc.createElement('script');
          script.dataset.previewLifecycle = 'true'; script.src = lifecycleURL; doc.head.append(script);
        } catch {}
      });
    });
  }
  new MutationObserver(watchChildren).observe(document, { childList: true, subtree: true });
  watchChildren();
  parent.postMessage({ type: 'portfolio-preview', event: 'lifecycle-ready' }, location.origin);
})();
