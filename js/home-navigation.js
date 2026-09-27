(() => {
  const nav = document.querySelector('.site-nav');
  const showcase = document.querySelector('.work-showcase');
  if (!nav || !showcase) return;
  const toggle = nav.querySelector('.nav-toggle');
  const links = [...nav.querySelectorAll('.navlinks a')];
  const sections = links.map(link => ({ link, section: link.hash ? document.querySelector(link.hash) : null })).filter(item => item.section);
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
    const offset = nav.offsetHeight + 30;
    nav.classList.toggle('is-scrolled', showcase.getBoundingClientRect().bottom <= nav.offsetHeight);
    let current = sections[0];
    sections.forEach(item => {
      if (item.section.getBoundingClientRect().top <= offset) current = item;
    });
    links.forEach(link => {
      if (link === current?.link) link.setAttribute('aria-current', 'location');
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
