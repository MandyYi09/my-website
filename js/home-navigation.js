(() => {
  if (location.protocol === 'file:') {
    const notice = document.createElement('p');
    notice.setAttribute('role', 'alert');
    notice.textContent = 'This portfolio needs a local web server. Double-click “Preview Portfolio.command” in the my-website folder, then use the page it opens.';
    Object.assign(notice.style, {
      position: 'relative', zIndex: '10001', margin: '0', padding: '14px 22px',
      background: '#e8d9a9', color: '#20251f', font: '14px/1.5 Arial, sans-serif'
    });
    document.body.prepend(notice);
  }
  const nav = document.querySelector('.site-nav');
  const showcase = document.querySelector('.motion-opening, .sports-stage, .work-showcase');
  if (!nav) return;
  const toggle = nav.querySelector('.nav-toggle');
  const links = [...nav.querySelectorAll('.navlinks a')];
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const localPreview = ['127.0.0.1', 'localhost'].includes(location.hostname);
  const freshPreviewUrl = value => {
    const url = new URL(value, location.href);
    url.searchParams.set('_preview', String(Date.now()));
    return url.href;
  };
  if (localPreview) {
    // A restored preview tab can contain an older HTML snapshot after a file edit.
    window.addEventListener('pageshow', event => {
      if (event.persisted) location.replace(freshPreviewUrl(location.href));
    });
  }
  const pageForHash = { '#sports': 'sports.html', '#work': 'work.html', '#photography': 'photography.html', '#about': 'about.html', '#introduction': 'about.html' };
  if (currentPage === 'index.html' && pageForHash[location.hash]) {
    location.replace(pageForHash[location.hash]);
    return;
  }
  const mobile = window.matchMedia('(max-width: 700px)');

  function closeMenu(restoreFocus = false) {
    nav.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.nav-toggle-label').textContent = 'Menu';
    if (restoreFocus) toggle.focus();
  }
  nav.classList.add('nav-ready');
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('menu-open');
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav-toggle-label').textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    closeMenu(mobile.matches);
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (!localPreview || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, location.href);
    const page = destination.pathname.split('/').pop();
    if (destination.origin !== location.origin ||
        !['index.html', 'sports.html', 'projects.html', 'photography.html', 'about.html', 'work.html'].includes(page)) return;
    event.preventDefault();
    location.assign(freshPreviewUrl(destination.href));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('menu-open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) closeMenu();
  });
  nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());

  function updateNavigation() {
    nav.classList.toggle('is-scrolled', !showcase || showcase.getBoundingClientRect().bottom <= nav.offsetHeight);
    links.forEach(link => {
      const target = link.getAttribute('href');
      if (target === currentPage || (currentPage === 'work.html' && target === 'projects.html')) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  let frame;
  window.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { updateNavigation(); frame = null; });
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();
})();
