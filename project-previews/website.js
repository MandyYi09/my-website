(() => {
  const atlas = new URLSearchParams(location.search).get('project') === 'zhong-art';
  if (atlas) { location.replace(new URL('zhong-art/index.html', location.href)); return; }
  const frame = document.querySelector('iframe');
  frame.title = atlas ? 'Modern Shuilu painting atlas' : 'Mandy’s Portfolio homepage';
  const resize = () => {
    const scale = innerWidth / 1280;
    frame.style.height = innerHeight / scale + 'px';
    frame.style.transform = `scale(${scale})`;
  };
  new ResizeObserver(resize).observe(document.body);
  resize();
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc) { parent.postMessage({ type: 'portfolio-preview', event: 'ready' }, location.origin); return; }
    let announced = false;
    const inspect = () => {
      if (atlas) {
        const collection = doc.querySelector('a[href$="/collection"]');
        if (!collection) return;
        if (!frame.contentWindow.location.pathname.endsWith('/collection')) {
          collection.click();
          return;
        }
        if (!doc.querySelector('main img')) return;
      } else if (!doc.querySelector('.showcase-swiper.swiper-initialized')) return;
      const images = [...doc.querySelectorAll('main img')].filter(image => {
        const rect = image.getBoundingClientRect();
        return !image.closest('[aria-hidden="true"], [inert]') &&
          rect.width > 0 && rect.height > 0 && rect.top < frame.clientHeight &&
          rect.bottom > 0 && rect.left < frame.clientWidth && rect.right > 0;
      });
      if (images.some(image => !image.complete || !image.naturalWidth)) return;
      if (!announced) {
        announced = true;
        observer.disconnect();
        parent.postMessage({ type: 'portfolio-preview', event: 'ready' }, location.origin);
      }
    };
    const observer = new MutationObserver(inspect);
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
    doc.addEventListener('load', inspect, true);
    inspect();
  });
  frame.src = atlas ? 'https://mandyyi09.github.io/zhong-art/' : '../index.html?slide=walker';
})();
