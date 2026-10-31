(() => {
  'use strict';
  const grid = document.querySelector('#project-grid');
  const count = document.querySelector('#result-count');
  const search = document.querySelector('#search');
  const empty = document.querySelector('#empty-state');
  const error = document.querySelector('#error-state');
  const dialog = document.querySelector('#project-dialog');
  const content = document.querySelector('#dialog-content');
  let projects = [];
  let previewObserver;
  let collectionsLoading = false;
  let previewTask;
  let previewTaskIsIdle = false;
  let loadingPreview;
  let previewTimeout;
  const visiblePreviews = new Set();
  const cardCache = new Map();
  const loadedCollections = new Map();
  const retainedPreviews = new Map();
  // Keep all normal desktop cards warm; trim least-recently-used frozen frames
  // conservatively on smaller devices or when the browser exposes heap pressure.
  const retentionLimit = navigator.deviceMemory <= 2 ? 4 : navigator.deviceMemory <= 4 ? 8 : 12;
  const circleSlug = 'p5-circle-multiplication';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const previewToggle = document.querySelector('#preview-toggle');
  let previewsPaused = motionPreference.matches;
  const circleDemos = {
    generative: 'circle-multiplication/index.html',
    interactive: 'circle-multiplication/interactive/index.html'
  };
  const liveCovers = {
    'ai-hands': 'project-previews/ai-hands/index.html',
    walker: 'project-previews/walker/index.html',
    'p5-circle-multiplication': 'circle-multiplication/index.html?embed=1',
    'grid-1': 'project-previews/grid-1/index.html',
    'grid-2': 'project-previews/grid-2/index.html',
    'align-studio': 'project-previews/align-studio/index.html',
    sportx: 'project-previews/sportx/index.html',
    'modern-shuilu': 'project-previews/zhong-art/index.html',
    'moderized-china-art-2d': 'zhong-art-preview/scene.html?embed=1',
    'moderized-china-art-3d': 'project-previews/cloud-gate/index.html',
    'my-website': 'project-previews/website.html?project=my-website'
  };

  // Keep the repository catalog intact; curate the two versions as one work.
  function groupProjects(data) {
    const generative = data.find(project => project.slug === circleSlug);
    const interactive = data.find(project => project.slug === circleSlug + '-interactive');
    if (!generative || !interactive) return data;
    return data.filter(project => project !== interactive).map(project => project === generative ? {
      ...generative,
      title: 'Circle Multiplication',
      shortDescription: generative.shortDescription,
      longDescription: generative.longDescription,
      demoUrl: circleDemos.generative,
      imageUrl: 'assets/images/projects/p5-circle-multiplication/color-cover.jpg',
      domainTags: [...new Set([...items(generative.domainTags), ...items(interactive.domainTags)])],
      versions: [interactive, generative]
    } : project);
  }
  const isCircleStudy = project => project.slug === circleSlug && Array.isArray(project.versions);

  const covers = {
    'ai-hands': 'assets/images/projects/ai-hands/color-poster.jpg',
    'grid-1': 'assets/images/projects/grid-1/grid-1.jpg',
    'grid-2': 'assets/images/projects/grid-2/grid-2.jpg',
    'walker': 'assets/images/projects/walker/walkerCard.png',
    'finger-wand': 'assets/images/projects/finger-wand/截屏2026-10-05 15.57.15.png',
    'sportx': 'assets/images/projects/SportX/rowing-studio.png',
    'align-studio': 'assets/images/projects/align-studio/studio.jpg',
    'modern-shuilu': 'assets/images/projects/zhong-art/atlas-cover.jpg',
    'moderized-china-art-2d': 'assets/images/projects/moderized-china-art-2d/截屏2026-10-05 16.03.14.png',
    'moderized-china-art-3d': 'assets/images/projects/3D-trad-art/sculpture-cover.png',
    'p5-circle-multiplication': 'assets/images/projects/p5-circle-multiplication/截屏2026-10-05 15.50.56.png',
    'p5-circle-multiplication-interactive': 'assets/images/projects/p5-circle-multiplication/截屏2026-10-05 15.50.56.png',
    'my-website': 'assets/images/projects/my-website/homepage.jpg'
  };
  const localProjects = {
    sportx: 'sportx-preview/index.html?mode=rowing',
    'moderized-china-art-2d': 'zhong-art-preview/scene.html'
  };
  const series = [
    {
      id: 'gesture',
      title: 'From fingertip tracking to full-body practice',
      description: 'AI Hands → Finger Wand → Align Studio → SportX. Each project grew from the last: I started by detecting fingertips, turned their movement into light, then explored full-body tracking for stretching. Align Studio focuses on stretching and yoga; SportX explores tennis, rowing, and clay shooting.',
      projects: ['ai-hands', 'finger-wand', 'align-studio'],
      stages: ['01 / Track fingertips', '02 / Draw with movement', '03 / Explore full-body tracking'],
      notes: ['Finger distance becomes color.', 'Motion becomes a trail of light.', 'Full-body tracking meets a 3D guide.']
    },
    {
      id: 'painting',
      title: 'From painting to interaction',
      description: 'My interest in Chinese art meets technology and vibe coding in three related experiments. Shuilu in Motion explores a 2D interactive environment; 3D Shuilu experiment explores a 3D character. Modern Shuilu brings the 2D study into its carousel, keeping the paintings and their cultural significance at the center.',
      projects: ['modern-shuilu', 'moderized-china-art-2d', 'moderized-china-art-3d'],
      stages: ['The website / Final context', '2D study / Adopted in the carousel', '3D study / Parallel exploration'],
      notes: ['Brings the 2D experiment into the website.', 'The animated scene selected for Modern Shuilu.', 'A sculptural approach to the same inspiration.']
    }
  ];
  const projectSeries = project => series.find(group => group.projects.includes(project.slug));
  const node = (tag, className = '', value) => {
    const result = document.createElement(tag);
    result.className = className;
    if (value !== undefined) result.textContent = value;
    return result;
  };
  const items = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  const safeUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      const localFile = location.protocol === 'file:' && url.protocol === 'file:' &&
        url.href.startsWith(new URL('./', document.baseURI).href);
      return ['http:', 'https:'].includes(url.protocol) || localFile ? url.href : null;
    } catch { return null; }
  };
  const visitUrl = project => safeUrl(project.demoUrl) || safeUrl(project.homepageUrl) || safeUrl(localProjects[project.slug]);
  const externalLink = (label, url, className) => {
    const anchor = node('a', className, label);
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  };
  function actions(project) {
    const result = node('div', 'project-actions');
    const visit = visitUrl(project);
    const repo = safeUrl(project.repositoryUrl);
    if (visit) result.append(externalLink(isCircleStudy(project) ? 'View project ↗' : 'Visit project ↗', visit, 'visit-link'));
    if (repo) result.append(externalLink('GitHub ↗', repo, 'github-link'));
    return result;
  }
  function liveArtwork(project) {
    const slug = project?.slug || circleSlug;
    const frame = node('iframe', 'project-live-preview' + (slug === circleSlug ? ' circle-preview' : ''));
    frame.title = (project?.title || 'Circle Multiplication') + ' live cover';
    frame.dataset.src = liveCovers[slug];
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.setAttribute('allow', "camera 'none'; microphone 'none'");
    frame.addEventListener('error', () => failPreview(frame));
    frame.addEventListener('load', () => {
      if (!frame.hasAttribute('src')) return;
      try {
        const doc = frame.contentDocument;
        if (!doc || doc.querySelector('script[data-preview-lifecycle]')) return;
        const script = doc.createElement('script');
        script.dataset.previewLifecycle = 'true';
        script.src = new URL('project-previews/preview-lifecycle.js?v=freeze-1', document.baseURI).href;
        doc.head.append(script);
      } catch { /* Remote documents keep their context and use native iframe throttling. */ }
    });
    return frame;
  }
  function previewStatus(frame, state, data = {}) {
    const art = frame.closest('.project-art');
    const status = art?.querySelector('.preview-loading');
    if (!status) return;
    const loading = state === 'loading';
    art.setAttribute('aria-busy', String(loading));
    status.hidden = state === 'ready' || state === 'stopped';
    const progress = status.querySelector('progress');
    progress.hidden = state === 'error';
    progress.removeAttribute('value');
    let label = state === 'error' ? 'Preview unavailable · showing screenshot' : 'Loading preview…';
    if (data.stage === 'download' && Number.isFinite(data.total) && data.total > 0 &&
        Number.isFinite(data.loaded) && data.loaded >= 0) {
      const percent = Math.min(100, Math.floor(data.loaded / data.total * 100));
      progress.value = percent;
      label = 'Loading preview · ' + percent + '%';
    } else if (data.stage === 'prepare') label = 'Preparing preview…';
    else if (data.stage === 'render') label = 'Preparing first frame…';
    status.querySelector('span').textContent = label;
  }
  function failPreview(frame) {
    frame.dataset.failed = 'true';
    stopPreview(frame);
    previewStatus(frame, 'error');
    schedulePreview();
  }
  window.addEventListener('message', event => {
    if (!['ready', 'progress', 'error', 'lifecycle-ready'].includes(event.data?.event) ||
        !['portfolio-preview', 'sportx-preview', 'zhong-art-preview'].includes(event.data?.type)) return;
    const frame = [...document.querySelectorAll('.project-live-preview[src]')]
      .find(candidate => candidate.contentWindow === event.source);
    if (!frame || event.origin !== new URL(frame.dataset.src, document.baseURI).origin) return;
    if (event.data.event === 'lifecycle-ready') {
      frame.dataset.canFreeze = 'true';
      setPreviewFrozen(frame, frame.dataset.frozen === 'true');
      updatePreviewBudgets();
      return;
    }
    if (event.data.event === 'error') { failPreview(frame); return; }
    if (event.data.event === 'progress') {
      if (!frame.classList.contains('is-ready') && frame.dataset.frozen !== 'true') previewStatus(frame, 'loading', event.data);
      return;
    }
    frame.classList.add('is-ready');
    previewStatus(frame, 'ready');
    frame.closest('.project-art')?.classList.add('is-live');
    if (frame === loadingPreview) finishPreviewLoad();
  });
  const canPlayPreviews = () => !previewsPaused && !dialog.open && !document.hidden;
  function cancelPreviewTask() {
    if (previewTaskIsIdle) window.cancelIdleCallback(previewTask);
    else clearTimeout(previewTask);
    previewTask = undefined;
  }
  function finishPreviewLoad() {
    clearTimeout(previewTimeout);
    loadingPreview = null;
    schedulePreview();
  }
  function schedulePreview() {
    if (previewTask !== undefined || loadingPreview || !canPlayPreviews()) return;
    if (![...visiblePreviews].some(frame => !frame.hasAttribute('src') && !frame.dataset.failed)) return;
    // Give input and painting priority; start only one expensive cover at a time.
    const start = () => {
      previewTask = undefined;
      if (!canPlayPreviews()) return;
      const frame = [...visiblePreviews].find(candidate => candidate.isConnected &&
        !candidate.hasAttribute('src') && !candidate.dataset.failed);
      if (!frame) return;
      loadingPreview = frame;
      retainedPreviews.delete(frame); retainedPreviews.set(frame, true);
      setPreviewFrozen(frame, false);
      previewStatus(frame, 'loading');
      // A slow cover must not hold the queue or lose its chance to become live.
      previewTimeout = setTimeout(finishPreviewLoad, 4000);
      frame.src = frame.dataset.src;
      trimPreviews();
    };
    // A short gap also prevents a batch of cached previews starting in one frame.
    previewTask = setTimeout(() => {
      previewTaskIsIdle = typeof window.requestIdleCallback === 'function';
      previewTask = previewTaskIsIdle ? window.requestIdleCallback(start, { timeout: 1000 }) : setTimeout(start, 0);
    }, 120);
    previewTaskIsIdle = false;
  }
  function stopPreview(frame) {
    retainedPreviews.delete(frame);
    delete frame.dataset.frozen;
    previewStatus(frame, 'stopped');
    if (frame === loadingPreview) {
      clearTimeout(previewTimeout);
      loadingPreview = null;
    }
    if (frame.hasAttribute('src')) frame.removeAttribute('src');
    frame.classList.remove('is-ready');
    frame.closest('.project-art')?.classList.remove('is-live');
  }
  function setPreviewFrozen(frame, frozen) {
    frame.dataset.frozen = String(frozen);
    // Unsupported remote documents are kept loaded; hiding the iframe lets the
    // browser suspend its animation rendering without discarding its document.
    frame.style.visibility = frozen && !frame.dataset.canFreeze ? 'hidden' : '';
    if (frame.hasAttribute('src')) {
      try { frame.contentWindow.postMessage({ type: 'portfolio-lifecycle', paused: frozen }, new URL(frame.dataset.src, document.baseURI).origin); } catch {}
    }
  }
  function freezePreview(frame) {
    previewStatus(frame, 'stopped');
    if (!frame.hasAttribute('src')) return;
    setPreviewFrozen(frame, true);
    if (frame === loadingPreview) { clearTimeout(previewTimeout); loadingPreview = null; }
  }
  function resumePreview(frame) {
    if (!frame.hasAttribute('src')) return;
    retainedPreviews.delete(frame); retainedPreviews.set(frame, true);
    setPreviewFrozen(frame, false);
  }
  function trimPreviews() {
    const heap = performance.memory;
    const pressured = heap && heap.usedJSHeapSize / heap.jsHeapSizeLimit > .8;
    const limit = pressured ? Math.min(retentionLimit, 4) : retentionLimit;
    for (const frame of retainedPreviews.keys()) {
      if (retainedPreviews.size <= limit) break;
      if (frame.dataset.frozen === 'true' && !visiblePreviews.has(frame)) stopPreview(frame);
    }
  }
  function updatePreviewBudgets() {
    const fps = visiblePreviews.size >= 3 ? 15 : 24;
    for (const frame of visiblePreviews) {
      if (frame.hasAttribute('src')) frame.contentWindow.postMessage({ type: 'portfolio-budget', fps }, new URL(frame.dataset.src, document.baseURI).origin);
    }
  }
  function pauseCardPreviews() {
    previewObserver?.disconnect();
    visiblePreviews.clear();
    cancelPreviewTask();
    grid.querySelectorAll('.project-live-preview').forEach(freezePreview);
    trimPreviews();
  }
  function watchCardPreviews() {
    previewObserver?.disconnect();
    visiblePreviews.clear();
    cancelPreviewTask();
    previewToggle.textContent = previewsPaused ? '▶ Play live covers' : 'Ⅱ Pause live covers';
    previewToggle.setAttribute('aria-pressed', String(previewsPaused));
    if (previewsPaused || dialog.open || document.hidden) {
      grid.querySelectorAll('.project-live-preview').forEach(freezePreview);
      trimPreviews();
      return;
    }
    previewObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting && !previewsPaused && !dialog.open && !document.hidden) {
          visiblePreviews.add(target);
          resumePreview(target);
          if (!target.classList.contains('is-ready')) previewStatus(target, target.dataset.failed ? 'error' : 'loading');
        } else {
          visiblePreviews.delete(target);
          freezePreview(target);
        }
      });
      trimPreviews();
      updatePreviewBudgets();
      schedulePreview();
    }, { threshold: 0.08 });
    grid.querySelectorAll('.project-live-preview').forEach(frame => previewObserver.observe(frame));
  }
  function circleDetails(project) {
    dialog.classList.add('circle-study-dialog');
    const eyebrow = node('p', 'study-eyebrow', 'Development · One rule, two experiences');
    const title = node('h2', '', 'Circle Multiplication');
    title.id = 'dialog-title';
    content.append(eyebrow, title, node('p', 'dialog-description',
      project.longDescription));

    const hero = node('figure', 'study-hero');
    const artwork = node('div', 'study-artwork');
    const image = node('img');
    image.src = project.imageUrl;
    image.alt = 'Straight chords weave a changing pattern inside a circle.';
    const frame = liveArtwork();
    if (!motionPreference.matches) frame.src = frame.dataset.src;
    artwork.append(image, frame);
    hero.append(artwork, node('figcaption', '', 'Generative study · The same construction, continuously unfolding.'));
    content.append(hero);

    const section = (number, heading, description) => {
      const result = node('section', 'study-section');
      result.append(node('span', 'study-step', number), node('h3', '', heading), node('p', '', description));
      return result;
    };
    const rule = section('01 / THE RULE', 'Curves made from straight lines',
      'Place N evenly spaced points around a circle. Connect each point i to (i × m) mod N. As the multiplier changes, the chords form curved envelopes and woven patterns.');
    rule.append(node('code', 'study-formula', 'i → (i × m) mod N'));
    content.append(rule);

    const explore = section('02 / INTERACTIVE EXPLORATION', 'Make the relationship visible',
      'The Math Garden exposes the multiplier, point count and color. Presets, a highlighted connection and a mathematical explanation help connect each adjustment to the resulting shape.');
    const labImage = node('img', 'study-lab-image');
    labImage.src = 'assets/images/projects/p5-circle-multiplication/interactive-en.png';
    labImage.alt = 'The interactive Math Garden: a circle diagram alongside multiplier and point-count sliders, color choices and playback controls.';
    labImage.loading = 'lazy';
    explore.append(labImage, node('p', 'study-takeaway', 'Design focus: let the viewer ask “what changes when I change this number?”'));
    content.append(explore);

    const refine = section('03 / GENERATIVE DIRECTION', 'Give the pattern room to move',
      'The fullscreen version carries the same mathematics into a quieter experience. Controls, annotations and plotting guides give way to a single circle that evolves on its own.');
    const decisions = node('div', 'study-decisions');
    for (const [heading, description] of [
      ['Composition', 'Freshly seeded point counts, colors and starting multipliers make each visit different.'],
      ['Movement', 'The multiplier changes continuously, so the chords become an unfolding composition.'],
      ['Framing', 'The circle fills the shorter viewport dimension and keeps its proportions on every screen.']
    ]) {
      const decision = node('div');
      decision.append(node('h4', '', heading), node('p', '', description));
      decisions.append(decision);
    }
    refine.append(decisions);
    content.append(refine);

    const versions = node('section', 'study-versions');
    versions.append(node('h3', '', 'Explore both versions'));
    for (const [version, label, description, url] of [
      [project.versions[0], 'Interactive Math Garden', 'Adjust the parameters and follow the rule.', circleDemos.interactive],
      [project.versions[1], 'Generative Study', 'Watch a new composition evolve fullscreen.', circleDemos.generative]
    ]) {
      const versionCard = node('div', 'study-version');
      versionCard.append(node('h4', '', label), node('p', '', description));
      const links = node('div', 'project-actions');
      links.append(externalLink('Open experience ↗', safeUrl(url), 'visit-link'));
      const repo = safeUrl(version.repositoryUrl);
      if (repo) links.append(externalLink('View source ↗', repo, 'github-link'));
      versionCard.append(links);
      versions.append(versionCard);
    }
    content.append(versions);
  }
  function relatedDevelopment(project) {
    const group = projectSeries(project);
    if (!group) return null;
    const section = node('section', 'related-development');
    section.append(node('p', 'study-eyebrow', group.id === 'gesture' ? 'Development sequence' : 'Related explorations'));
    section.append(node('h3', '', group.title), node('p', 'related-description', group.description));
    const list = node('ol', 'development-path development-path-' + group.id);
    group.projects.forEach((slug, index) => {
      const related = projects.find(item => item.slug === slug);
      if (!related) return;
      const step = node('li');
      const button = node('button', 'development-link');
      button.type = 'button';
      button.append(node('span', 'development-stage', group.stages[index]), node('strong', '', related.title), node('span', 'development-note', group.notes[index]));
      if (slug === project.slug) button.setAttribute('aria-current', 'step');
      button.addEventListener('click', () => openDetails(related));
      step.append(button);
      list.append(step);
    });
    section.append(list);
    return section;
  }
  function openDetails(project) {
    document.querySelector('#dialog-category').textContent = project.category || 'Project';
    content.replaceChildren();
    pauseCardPreviews();
    dialog.classList.remove('circle-study-dialog');
    if (isCircleStudy(project)) {
      circleDetails(project);
      dialog.showModal();
      dialog.scrollTop = 0;
      return;
    }
    const title = node('h2', '', project.title);
    title.id = 'dialog-title';
    content.append(title);
    content.append(node('p', 'dialog-description', project.longDescription || project.shortDescription || ''));
    const imageUrl = safeUrl(project.imageUrl) || safeUrl(project.screenshotUrl) || safeUrl(covers[project.slug]);
    if (project.slug === 'ai-hands') {
      const video = node('video', 'dialog-image');
      video.src = 'assets/images/projects/ai-hands/color-preview.mp4';
      video.poster = covers['ai-hands'];
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = true;
      video.autoplay = !motionPreference.matches && !previewsPaused;
      video.setAttribute('aria-label', 'AI Hands recording: fingertip distance changes the background color');
      content.append(video);
    } else if (imageUrl) {
      const image = node('img', 'dialog-image');
      image.src = imageUrl;
      image.alt = project.title + ' project preview';
      content.append(image);
    }
    const development = relatedDevelopment(project);
    if (development) content.append(development);
    const facts = node('dl', 'dialog-facts');
    const fact = (label, value) => {
      if (!value) return;
      const row = node('div', 'dialog-fact');
      row.append(node('dt', '', label), node('dd', '', value));
      facts.append(row);
    };
    fact('Made with', (items(project.technologies).length ? items(project.technologies) : items(project.programmingLanguages)).join(' · '));
    fact('Exploring', items(project.domainTags).map(tag => tag.replaceAll('-', ' ')).join(' · '));
    fact('Related subjects', items(project.schoolSubjects).join(' · '));
    fact('Notes', items(project.limitations).join(' '));
    if (facts.childElementCount) content.append(facts);
    const links = actions(project);
    const screenshot = safeUrl(project.screenshotUrl);
    if (screenshot) links.append(externalLink('View screenshot ↗', screenshot, 'screenshot-link'));
    if (links.childElementCount) content.append(links);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  function card(project) {
    const article = node('article', 'project-card');
    article.dataset.project = project.slug || '';
    article.id = 'project-' + project.slug;
    const art = node('div', 'project-art art-' + project.collectionIndex % 7);
    if (project.slug === 'walker') art.classList.add('walker-cover');
    const imageUrl = project.slug === 'sportx' ? safeUrl('assets/images/projects/SportX/rowing-full-cover.png?v=quarter-4') :
      safeUrl(project.imageUrl) || safeUrl(project.screenshotUrl) || safeUrl(covers[project.slug]);
    if (imageUrl) {
      const image = node('img');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.src = imageUrl;
      art.append(image);
      if (project.screenshotUrl) art.classList.add('notebook-cover');
    } else if (project.slug === 'behind-the-event') {
      art.classList.add('event-cover');
      const board = node('div', 'event-cover-board');
      board.append(node('span', 'event-cover-status', 'Work in progress'));
      const flow = node('div', 'event-cover-flow');
      ['Plan', 'Coordinate', 'Adapt'].forEach((label, index) => {
        const step = node('div');
        step.append(node('span', '', '0' + (index + 1)), node('strong', '', label));
        flow.append(step);
      });
      board.append(flow, node('span', 'event-cover-caption', 'People · Venue · Communication'));
      art.append(board);
    } else art.append(node('span', 'art-label', project.title));
    if (liveCovers[project.slug]) {
      art.classList.add('live-cover');
      if (isCircleStudy(project)) art.classList.add('circle-study-cover');
      art.append(liveArtwork(project));
      const status = node('div', 'preview-loading');
      status.hidden = true;
      status.setAttribute('role', 'status');
      const progress = node('progress');
      progress.max = 100;
      progress.setAttribute('aria-label', project.title + ' preview loading');
      status.append(node('span', '', 'Loading preview…'), progress);
      art.append(status);
    }
    const body = node('div', 'project-card-body');
    body.append(node('span', 'project-category', project.category || 'Project'));
    body.append(node('h2', '', project.title));
    const group = projectSeries(project);
    if (group) body.append(node('p', 'project-development-stage', group.stages[group.projects.indexOf(project.slug)]));
    if (project.slug === 'sportx') body.append(node('p', 'project-development-stage', '04 / SportX · Tennis, rowing & clay shooting'));
    body.append(node('p', 'description', project.shortDescription || 'Explore the details of this project.'));
    const links = actions(project);
    const more = node('button', 'more-link', 'More information ↗');
    more.type = 'button';
    more.setAttribute('aria-label', 'More information about ' + project.title);
    more.addEventListener('click', () => openDetails(project));
    links.append(more);
    body.append(links);
    article.append(art, body);
    return article;
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = projects.filter(project => [project.title, project.shortDescription, project.longDescription, project.category,
      ...items(project.technologies), ...items(project.programmingLanguages), ...items(project.domainTags)]
      .join(' ').toLocaleLowerCase().includes(query));
    const children = [];
    const renderedGroups = new Set();
    visible.forEach(project => {
      const group = projectSeries(project);
      if (group && !renderedGroups.has(group.id)) {
        const heading = node('header', 'project-series-heading');
        heading.append(node('p', 'study-eyebrow', group.id === 'gesture' ? 'Connected work / Development' : 'Connected work / Shared inspiration'));
        const title = node('h2', '', group.title);
        title.id = 'series-' + group.id;
        heading.append(title, node('p', 'series-description', group.description));
        children.push(heading);
        renderedGroups.add(group.id);
      }
      const key = project.slug || project.id || project.title;
      let article = cardCache.get(key);
      if (!article || article.project !== project) {
        article = card(project);
        article.project = project;
        cardCache.set(key, article);
      }
      article.classList.toggle('project-card-feature', !query && project.slug === 'sportx');
      children.push(article);
    });
    // Reconcile in place so arriving data and search do not reload existing frames.
    const retained = new Set(children);
    [...grid.children].forEach(child => {
      if (!retained.has(child)) {
        child.querySelectorAll('.project-live-preview').forEach(stopPreview);
        child.remove();
      }
    });
    children.forEach((child, index) => {
      if (grid.children[index] !== child) grid.insertBefore(child, grid.children[index] || null);
    });
    watchCardPreviews();
    count.textContent = (query ? visible.length + ' of ' + projects.length + ' projects' : projects.length + ' projects') +
      (collectionsLoading ? ' · Loading…' : '');
    empty.hidden = collectionsLoading || visible.length !== 0 || !error.hidden;
  }
  async function loadCollections(onCollection) {
    if (location.protocol === 'file:') {
      // Classic scripts can read bundled data from disk; fetch cannot on file URLs.
      if (!window.portfolioProjectCatalog) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'data/project-catalog.js';
          script.onload = resolve;
          script.onerror = () => { script.remove(); reject(new Error('Project catalog unavailable')); };
          document.head.append(script);
        });
      }
      const collections = window.portfolioProjectCatalog;
      if (!Array.isArray(collections) || collections.some(collection => !Array.isArray(collection))) {
        throw new Error('Invalid project catalog');
      }
      collections.forEach((collection, index) => onCollection(collection, index));
      return [];
    }
    return Promise.allSettled(['data/git-projects.json', 'data/study-projects.json', 'data/curated-projects.json'].map(async path => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(path, { cache: 'no-cache', signal: controller.signal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const collection = await response.json();
        if (!Array.isArray(collection)) throw new Error('Invalid project collection');
        onCollection(collection, path);
      } finally {
        clearTimeout(timeout);
      }
    }));
  }
  async function load() {
    if (collectionsLoading) return;
    collectionsLoading = true;
    error.hidden = true;
    empty.hidden = true;
    grid.setAttribute('aria-busy', 'true');
    count.textContent = 'Loading projects…';
    try {
      const results = await loadCollections((collection, key) => {
        if (collection.some(project => !project || typeof project.title !== 'string')) throw new Error('Invalid project collection');
        loadedCollections.set(key, collection);
        const previous = new Map(projects.map(project => [project.slug || project.id || project.title, project]));
        projects = groupProjects([...loadedCollections.values()].flat()).sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity))
          .map((project, collectionIndex) => {
            const existing = previous.get(project.slug || project.id || project.title);
            const { collectionIndex: previousIndex, ...previousData } = existing || {};
            return existing && JSON.stringify(previousData) === JSON.stringify(project) ? existing : { ...project, collectionIndex };
          });
        render();
      });
      if (results.some(result => result.status === 'rejected')) throw new Error('Project collection unavailable');
    } catch {
      error.hidden = false;
      error.querySelector('h2').textContent = projects.length ? 'Some projects couldn’t load.' : 'Projects couldn’t load.';
      if (location.protocol === 'file:') error.querySelector('p').textContent = 'Project data is missing. Open “Preview Portfolio.command” from the website folder to try the local preview.';
    } finally {
      collectionsLoading = false;
      grid.setAttribute('aria-busy', 'false');
      render();
    }
  }
  search.addEventListener('input', render);
  // Defer new cover work while the visitor scrolls, types, or clicks.
  ['scroll', 'pointerdown', 'keydown'].forEach(type => window.addEventListener(type, () => {
    cancelPreviewTask();
    schedulePreview();
  }, { passive: true }));
  previewToggle.addEventListener('click', () => {
    previewsPaused = !previewsPaused;
    if (!previewsPaused) grid.querySelectorAll('.project-live-preview').forEach(frame => delete frame.dataset.failed);
    watchCardPreviews();
  });
  document.addEventListener('visibilitychange', watchCardPreviews);
  document.querySelector('#reset').addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  document.querySelector('#retry').addEventListener('click', load);
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    content.replaceChildren();
    dialog.classList.remove('circle-study-dialog');
    watchCardPreviews();
  });
  motionPreference.addEventListener('change', () => {
    previewsPaused = motionPreference.matches;
    content.querySelectorAll('.circle-preview').forEach(frame => {
      if (motionPreference.matches) stopPreview(frame);
      else frame.src = frame.dataset.src;
    });
    watchCardPreviews();
  });
  load();
})();
