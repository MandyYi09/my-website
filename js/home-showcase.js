(() => {
  const root = document.querySelector('.work-showcase');
  if (!root || typeof Swiper === 'undefined') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pause = root.querySelector('.showcase-pause');
  const titles = ['Grid 1', 'Walker', 'Grid 2', 'Photography'];
  let paused = reducedMotion.matches;
  let inView = true;

  function updateSlides(swiper) {
    swiper.slides.forEach((slide, index) => {
      const active = index === swiper.activeIndex;
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    root.querySelectorAll('.swiper-pagination-bullet').forEach((button, index) => {
      button.setAttribute('aria-current', index === swiper.activeIndex ? 'true' : 'false');
    });
  }

  const swiper = new Swiper(root.querySelector('.showcase-swiper'), {
    effect: 'slide',
    direction: 'horizontal',
    speed: reducedMotion.matches ? 0 : 850,
    rewind: true,
    grabCursor: true,
    autoplay: { enabled: !paused, delay: 7000, disableOnInteraction: true, pauseOnMouseEnter: true },
    navigation: { nextEl: root.querySelector('.showcase-next'), prevEl: root.querySelector('.showcase-prev') },
    pagination: {
      el: root.querySelector('.showcase-pagination'),
      clickable: true,
      renderBullet: (index, className) => `<button class="${className}" type="button"><span>0${index + 1}</span>${titles[index]}</button>`
    },
    a11y: { containerMessage: 'Selected work slideshow', paginationBulletMessage: 'Show project {{index}}', prevSlideMessage: 'Previous project', nextSlideMessage: 'Next project' },
    on: { init: updateSlides, slideChange: updateSlides }
  });

  function updatePlayback() {
    const playing = swiper.autoplay.running;
    pause.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
    pause.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
  }
  function stopPlayback() { paused = true; swiper.autoplay.stop(); }
  swiper.on('autoplayStart', updatePlayback);
  swiper.on('autoplayStop', updatePlayback);
  swiper.on('sliderFirstMove', stopPlayback);
  pause.addEventListener('click', () => {
    paused = swiper.autoplay.running;
    if (paused) swiper.autoplay.stop();
    else swiper.autoplay.start();
  });
  root.addEventListener('focusin', event => { if (!pause.contains(event.target)) stopPlayback(); });
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); stopPlayback();
    if (event.key === 'ArrowRight') swiper.slideNext(); else swiper.slidePrev();
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) swiper.autoplay.stop();
    else if (!paused && !document.hidden) swiper.autoplay.start();
  }, { threshold: .25 }).observe(root);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) swiper.autoplay.stop();
    else if (!paused && inView) swiper.autoplay.start();
  });
  reducedMotion.addEventListener('change', event => {
    swiper.params.speed = event.matches ? 0 : 850;
    if (event.matches) stopPlayback();
  });
  updatePlayback();

  // Use current catalog descriptions and destinations when the data is updated.
  fetch('data/git-projects.json', { cache: 'no-cache' })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(projects => {
      if (!Array.isArray(projects)) return;
      root.querySelectorAll('[data-project]').forEach(slide => {
        const project = projects.find(item => item.slug === slide.dataset.project);
        if (!project) return;
        if (project.shortDescription) slide.querySelector('.showcase-description').textContent = project.shortDescription;
        const destination = project.demoUrl || project.repositoryUrl;
        if (destination && /^https?:\/\//i.test(destination)) slide.querySelector('.showcase-link').href = destination;
      });
    }).catch(() => {});
})();
