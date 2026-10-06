(() => {
  const nav = document.querySelector('.site-nav');
  const showcase = document.querySelector('.work-showcase');
  if (!nav) return;
  const toggle = nav.querySelector('.nav-toggle');
  const links = [...nav.querySelectorAll('.navlinks a')];
  const currentPage = location.pathname.split('/').pop() || 'index.html';
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
    if (event.target.closest('a')) closeMenu(mobile.matches);
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
