(() => {
  const root = document.querySelector('.work-showcase');
  if (!root || typeof Swiper === 'undefined') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pause = root.querySelector('.showcase-pause');
  const titles = ['FitAI', 'Zhong Art', 'Walker', 'Grid 1', 'Photography'];
  let paused = reducedMotion.matches;
  let inView = true;
  const openingActive = () => document.body.classList.contains('intro-playing');

  let livePaused = reducedMotion.matches;
  let activeSwiper;
  const photoSlide = root.querySelector('.showcase-slide--photo');
  const photoGallery = photoSlide?.querySelector('.showcase-photo-gallery');
  const photoToggle = photoSlide?.querySelector('.showcase-photo-toggle');
  const photoSources = [
    'assets/images/photography/LA.jpg',
    'assets/images/photography/La Jolla.jpg',
    'assets/images/photography/mountain.jpg'
  ];
  let photoSwiper;
  let photoPaused = reducedMotion.matches;
  function updatePhotoPlayback() {
    if (!photoSwiper) return;
    const playing = activeSwiper?.slides[activeSwiper.activeIndex] === photoSlide &&
      photoSlide.classList.contains('is-photo-ready') && !photoPaused && inView &&
      !document.hidden && !openingActive();
    photoToggle.textContent = photoPaused ? '▶ Play photos' : 'Ⅱ Pause photos';
    photoToggle.setAttribute('aria-label', photoPaused ? 'Play photo background' : 'Pause photo background');
    if (playing && !photoSwiper.autoplay.running) photoSwiper.autoplay.start();
    else if (!playing && photoSwiper.autoplay.running) photoSwiper.autoplay.stop();
  }
  function loadNearbyPhotos(swiper) {
    for (const index of [swiper.activeIndex, (swiper.activeIndex + 1) % swiper.slides.length]) {
      const image = swiper.slides[index]?.querySelector('img[data-src]');
      if (image) { image.src = image.dataset.src; image.removeAttribute('data-src'); }
    }
  }
  function ensurePhotoGallery() {
    if (photoSwiper) return;
    const wrapper = photoGallery.querySelector('.swiper-wrapper');
    photoSources.forEach(src => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      const image = document.createElement('img');
      image.alt = '';
      image.decoding = 'async';
      image.dataset.src = src;
      slide.append(image);
      wrapper.append(slide);
    });
    wrapper.querySelector('img').addEventListener('load', () => {
      photoSlide.classList.add('is-photo-ready');
      updatePhotoPlayback();
    }, { once: true });
    photoSwiper = new Swiper(photoGallery, {
      effect: 'slide',
      speed: reducedMotion.matches ? 0 : 900,
      loop: true,
      allowTouchMove: false,
      autoplay: { enabled: false, delay: 2800, disableOnInteraction: false },
      on: { init: loadNearbyPhotos, slideChangeTransitionStart: loadNearbyPhotos }
    });
    updatePhotoPlayback();
  }
  function updateLive() {
    if (!activeSwiper) return;
    activeSwiper.slides.forEach((slide,index) => {
      const frame=slide.querySelector('.showcase-live');
      if (!frame) return;
      const playing=index===activeSwiper.activeIndex && !livePaused && inView && !document.hidden && !openingActive();
      const button=slide.querySelector('.showcase-live-toggle');
      button.textContent=livePaused?'▶ Play background':'Ⅱ Pause background';
      button.setAttribute('aria-label',livePaused?'Play live background':'Pause live background');
      if(playing && !frame.hasAttribute('src')) frame.src=frame.dataset.src;
      else if(!playing && frame.hasAttribute('src')) {
        frame.removeAttribute('src'); slide.classList.remove('is-live');
      }
    });
  }
  root.querySelectorAll('.showcase-live').forEach(frame=>{
    frame.addEventListener('load',()=>{
      if(frame.hasAttribute('src') && !['fitai','zhong-art'].includes(frame.closest('[data-project]')?.dataset.project)) frame.closest('.showcase-slide').classList.add('is-live');
    });
  });
  window.addEventListener('message',event=>{
    const frame=root.querySelector('[data-project="fitai"] .showcase-live');
    if(event.origin === location.origin && event.source === frame?.contentWindow &&
       event.data?.type === 'fitai-preview' && event.data.event === 'ready' && frame.hasAttribute('src')) {
      frame.closest('.showcase-slide').classList.add('is-live');
    }
  });
  window.addEventListener('message',event=>{
    const frame=root.querySelector('[data-project="zhong-art"] .showcase-live');
    if(event.origin === location.origin && event.source === frame?.contentWindow &&
       event.data?.type === 'zhong-art-preview' && event.data.event === 'ready' && frame.hasAttribute('src')) {
      frame.closest('.showcase-slide').classList.add('is-live');
    }
  });
  root.querySelectorAll('.showcase-live-toggle').forEach(button=>{
    button.addEventListener('click',()=>{livePaused=!livePaused;updateLive();});
  });
  function updateSlides(swiper) {
    activeSwiper=swiper;
    updateLive();
    if (swiper.slides[swiper.activeIndex] === photoSlide) ensurePhotoGallery();
    else updatePhotoPlayback();
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
  photoToggle.addEventListener('click', () => { photoPaused = !photoPaused; updatePhotoPlayback(); });
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); stopPlayback();
    if (event.key === 'ArrowRight') swiper.slideNext(); else swiper.slidePrev();
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateLive();
    updatePhotoPlayback();
    if (!inView) swiper.autoplay.stop();
    else if (!paused && !document.hidden && !openingActive()) swiper.autoplay.start();
  }, { threshold: .25 }).observe(root);
  document.addEventListener('visibilitychange', () => {
    updateLive();
    updatePhotoPlayback();
    if (document.hidden) swiper.autoplay.stop();
    else if (!paused && inView && !openingActive()) swiper.autoplay.start();
  });
  reducedMotion.addEventListener('change', event => {
    swiper.params.speed = event.matches ? 0 : 850;
    livePaused=event.matches;updateLive();
    photoPaused = event.matches;
    if (photoSwiper) photoSwiper.params.speed = event.matches ? 0 : 900;
    updatePhotoPlayback();
    if (event.matches) stopPlayback();
  });
  document.addEventListener('opening-start', () => {swiper.autoplay.stop();updateLive();updatePhotoPlayback();});
  document.addEventListener('opening-complete', () => {
    swiper.update();
    updateLive();
    updatePhotoPlayback();
    if (!paused && inView && !document.hidden) swiper.autoplay.start();
  });
  let resizeTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      root.querySelectorAll('.showcase-live[src]').forEach(frame=>{frame.closest('.showcase-slide').classList.remove('is-live');frame.removeAttribute('src');});
      updateLive();
    },250);
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
        if (project.slug !== 'fitai' && !slide.hasAttribute('data-editorial-copy') && project.shortDescription) slide.querySelector('.showcase-description').textContent = project.shortDescription;
        const destination = project.demoUrl || project.repositoryUrl;
        if (project.slug !== 'fitai' && destination && /^https?:\/\//i.test(destination)) slide.querySelector('.showcase-link').href = destination;
      });
    }).catch(() => {});
})();
