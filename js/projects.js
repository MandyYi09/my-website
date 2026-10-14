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
  const circleSlug = 'p5-circle-multiplication';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const circleDemos = {
    generative: 'circle-multiplication/index.html',
    interactive: 'circle-multiplication/interactive/index.html'
  };

  // Keep the repository catalog intact; curate the two versions as one work.
  function groupProjects(data) {
    const generative = data.find(project => project.slug === circleSlug);
    const interactive = data.find(project => project.slug === circleSlug + '-interactive');
    if (!generative || !interactive) return data;
    return data.filter(project => project !== interactive).map(project => project === generative ? {
      ...generative,
      title: 'Circle Multiplication',
      shortDescription: 'From an interactive math garden to a continuously evolving generative artwork.',
      longDescription: 'One circle, one multiplication rule, two ways to experience it. The Interactive Math Garden makes the parameters visible; the Generative Study turns the same construction into a fullscreen, continuously evolving artwork.',
      demoUrl: circleDemos.generative,
      imageUrl: 'assets/images/projects/p5-circle-multiplication/generative.jpg',
      domainTags: [...new Set([...items(generative.domainTags), ...items(interactive.domainTags)])],
      versions: [interactive, generative]
    } : project);
  }
  const isCircleStudy = project => project.slug === circleSlug && Array.isArray(project.versions);

  const covers = {
    'ai-hands': 'assets/images/projects/ai-hands/handsCard.png',
    'grid-1': 'assets/images/projects/grid-1/grid-1.jpg',
    'grid-2': 'assets/images/projects/grid-2/grid-2.jpg',
    'walker': 'assets/images/projects/walker/walkerCard.png',
    'finger-wand': 'assets/images/projects/finger-wand/截屏2026-10-05 15.57.15.png',
    'fitai': 'assets/images/projects/fitAi/yoga-cover.jpg',
    'moderized-china-art-2d': 'assets/images/projects/moderized-china-art-2d/截屏2026-10-05 16.03.14.png',
    'moderized-china-art-3d': 'assets/images/projects/3D-trad-art/3D-trad-art.png',
    'p5-circle-multiplication': 'assets/images/projects/p5-circle-multiplication/截屏2026-10-05 15.50.56.png',
    'p5-circle-multiplication-interactive': 'assets/images/projects/p5-circle-multiplication/截屏2026-10-05 15.50.56.png',
    'my-website': 'assets/images/projects/my-website/homepage.jpg'
  };
  const localProjects = {
    fitai: 'fitai-preview/index.html?mode=yoga',
    'moderized-china-art-2d': 'zhong-art-preview/scene.html'
  };
  const categoryOrder = ['Interactive Art', 'Movement & Fitness', '3D Art & Visualization', 'Creative Coding', 'UCLA Summer Study', 'Mathematical Visualization'];
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
    if (visit) result.append(externalLink(isCircleStudy(project) ? 'Experience artwork ↗' : 'Visit project ↗', visit, 'visit-link'));
    if (repo && !isCircleStudy(project)) result.append(externalLink('GitHub ↗', repo, 'github-link'));
    return result;
  }
  function liveArtwork() {
    const frame = node('iframe', 'project-live-preview circle-preview');
    frame.title = 'Animated circle multiplication artwork';
    frame.dataset.src = circleDemos.generative;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.addEventListener('load', () => {
      frame.classList.toggle('is-ready', frame.hasAttribute('src'));
    });
    return frame;
  }
  function stopPreview(frame) {
    frame.removeAttribute('src');
    frame.classList.remove('is-ready');
  }
  function pauseCardPreviews() {
    previewObserver?.disconnect();
    grid.querySelectorAll('.circle-preview').forEach(stopPreview);
  }
  function watchCardPreviews() {
    previewObserver?.disconnect();
    if (motionPreference.matches || dialog.open) {
      grid.querySelectorAll('.circle-preview').forEach(stopPreview);
      return;
    }
    previewObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting && !target.hasAttribute('src')) target.src = target.dataset.src;
        else if (!isIntersecting) stopPreview(target);
      });
    }, { threshold: 0.05 });
    grid.querySelectorAll('.circle-preview').forEach(frame => previewObserver.observe(frame));
  }
  function circleDetails(project) {
    dialog.classList.add('circle-study-dialog');
    const eyebrow = node('p', 'study-eyebrow', 'Development · One rule, two experiences');
    const title = node('h2', '', 'Circle Multiplication');
    title.id = 'dialog-title';
    content.append(eyebrow, title, node('p', 'dialog-description',
      'Exploring how a simple multiplication rule can become both a tool for understanding and a moving visual experience.'));

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
    labImage.src = 'assets/images/projects/p5-circle-multiplication/interactive.jpg';
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
    if (imageUrl) {
      const image = node('img', 'dialog-image');
      image.src = imageUrl;
      image.alt = project.title + ' project preview';
      content.append(image);
    }
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
    dialog.showModal();
  }
  function card(project) {
    const article = node('article', 'project-card');
    article.dataset.project = project.slug || '';
    const art = node('div', 'project-art art-' + project.collectionIndex % 7);
    const imageUrl = safeUrl(project.imageUrl) || safeUrl(project.screenshotUrl) || safeUrl(covers[project.slug]);
    if (imageUrl) {
      const image = node('img');
      image.alt = '';
      image.loading = 'lazy';
      image.src = imageUrl;
      art.append(image);
      if (project.screenshotUrl) art.classList.add('notebook-cover');
    } else art.append(node('span', 'art-label', project.title));
    if (isCircleStudy(project)) {
      art.classList.add('circle-study-cover');
      art.append(liveArtwork());
    }
    const body = node('div', 'project-card-body');
    body.append(node('span', 'project-category', project.category || 'Project'));
    body.append(node('h2', '', project.title));
    body.append(node('p', 'description', project.shortDescription || 'Explore the details of this project.'));
    const links = actions(project);
    const more = node('button', 'more-link', isCircleStudy(project) ? 'Development ↗' : 'More information ↗');
    more.type = 'button';
    more.setAttribute('aria-label', (isCircleStudy(project) ? 'Development of ' : 'More information about ') + project.title);
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
    pauseCardPreviews();
    grid.replaceChildren(...visible.map(card));
    watchCardPreviews();
    count.textContent = query ? visible.length + ' of ' + projects.length + ' projects' : projects.length + ' projects';
    empty.hidden = visible.length !== 0;
  }
  async function loadCollections() {
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
      return collections;
    }
    return Promise.all(['data/git-projects.json', 'data/study-projects.json'].map(async path => {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const collection = await response.json();
      if (!Array.isArray(collection)) throw new Error('Invalid project collection');
      return collection;
    }));
  }
  async function load() {
    error.hidden = true;
    empty.hidden = true;
    grid.setAttribute('aria-busy', 'true');
    count.textContent = 'Loading projects…';
    try {
      const collections = await loadCollections();
      const data = groupProjects(collections.flat());
      if (data.some(project => !project || typeof project.title !== 'string')) throw new Error('Invalid project collection');
      const rank = category => {
        const index = categoryOrder.indexOf(category);
        return index < 0 ? categoryOrder.length : index;
      };
      projects = data.sort((a, b) => rank(a.category) - rank(b.category) || (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity))
        .map((project, collectionIndex) => ({ ...project, collectionIndex }));
      render();
    } catch {
      count.textContent = 'Projects unavailable';
      error.hidden = false;
      if (location.protocol === 'file:') error.querySelector('p').textContent = 'Project data is missing. Open “Preview Portfolio.command” from the website folder to try the local preview.';
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }
  search.addEventListener('input', render);
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
    content.querySelectorAll('.circle-preview').forEach(frame => {
      if (motionPreference.matches) stopPreview(frame);
      else frame.src = frame.dataset.src;
    });
    watchCardPreviews();
  });
  load();
})();
