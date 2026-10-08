(() => {
  'use strict';

  const grid = document.querySelector('#project-grid');
  const count = document.querySelector('#result-count');
  const search = document.querySelector('#search');
  const sort = document.querySelector('#sort');
  const empty = document.querySelector('#empty-state');
  const error = document.querySelector('#error-state');
  let projects = [];
  let previewObserver;
  const projectCovers = {
    'ai-hands': 'assets/images/projects/ai-hands/handsCard.png',
    'grid-1': 'assets/images/projects/grid-1/grid-1.jpg',
    'grid-2': 'assets/images/projects/grid-2/grid-2.jpg',
    'walker': 'assets/images/projects/walker/walkerCard.png',
    'ai-hands-exp-2': 'assets/images/projects/ai-hands-exp-2/截屏2026-10-05 15.57.15.png',
    'fitai': 'assets/images/projects/fitAi/yoga-cover.jpg',
    'moderized-china-art-2d': 'assets/images/projects/moderized-china-art-2d/截屏2026-10-05 16.03.14.png',
    'moderized-china-art-3d': 'assets/images/projects/3D-trad-art/3D-trad-art.png',
    'p5-circle-multiplication': 'assets/images/projects/p5-circle-multiplication/截屏2026-10-05 15.50.56.png',
    'p5-circle-multiplication-interactive': 'assets/images/projects/p5-circle-multiplication/截屏2026-10-05 15.50.56.png',
    'my-website': 'assets/images/projects/my-website/homepage.jpg'
  };
  const livePreviews = {
    'walker': 'https://mandyyi09.github.io/walker/',
    'ai-hands': 'https://mandyyi09.github.io/ai-hands/',
    'grid-1': 'https://mandyyi09.github.io/grid-1/',
    'grid-2': 'https://mandyyi09.github.io/grid-2/',
    'fitai': 'fitai-preview/index.html?mode=yoga&embed=1&layout=full',
    'moderized-china-art-2d': 'zhong-art-preview/scene.html?embed=1',
    'p5-circle-multiplication': 'https://mandyyi09.github.io/p5-circle-multiplication/'
  };

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const list = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  const safeUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  const link = (label, url, className = '') => {
    const node = element('a', className, label);
    node.href = url;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    return node;
  };
  const dateValue = project => Date.parse(project.updatedAt) || 0;
  const categoryOrder = [
    'Interactive Art',
    'Movement & Fitness',
    '3D Art & Visualization',
    'Creative Coding',
    'UCLA Summer Study',
    'Mathematical Visualization'
  ];
  const categoryRank = category => {
    const index = categoryOrder.indexOf(category);
    return index === -1 ? categoryOrder.length : index;
  };
  function card(project) {
    const article = element('article', 'project-card');
    article.dataset.project = project.slug;
    const art = element('div', `project-art art-${project.collectionIndex % 7}`);
    // Prefer catalog artwork, then an existing project screenshot.
    art.append(element('span', 'art-label', project.title), element('span', 'art-number', String(project.collectionIndex + 1).padStart(2, '0')));
    art.setAttribute('aria-hidden', 'true');
    const imageUrl = safeUrl(project.imageUrl) || safeUrl(projectCovers[project.slug]);
    if (imageUrl) {
      const image = element('img');
      image.alt = '';
      image.loading = 'lazy';
      image.addEventListener('load', () => art.classList.add('has-image'));
      image.addEventListener('error', () => { image.remove(); art.classList.remove('has-image'); });
      image.src = imageUrl;
      art.append(image);
    }
    if (project.screenshotUrl) art.classList.add('notebook-cover');
    if (livePreviews[project.slug] && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const preview = element('iframe', 'project-live-preview');
      preview.title = `${project.title} live preview`;
      preview.loading = 'lazy';
      preview.tabIndex = -1;
      preview.setAttribute('aria-hidden', 'true');
      preview.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      preview.dataset.src = livePreviews[project.slug];
      preview.dataset.project = project.slug;
      preview.addEventListener('load', () => {
        if (preview.hasAttribute('src') && !['fitai', 'moderized-china-art-2d'].includes(project.slug)) art.classList.add('preview-ready');
      });
      art.append(preview, element('span', 'preview-label', 'Live preview'));
    }
    const meta = element('div', 'card-meta');
    if (dateValue(project)) {
      const date = new Date(dateValue(project));
      const time = element('time', '', date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }));
      time.dateTime = date.toISOString();
      time.title = 'Last updated';
      meta.append(time);
    }
    article.append(art, element('h3', '', project.title), element('p', 'description', project.shortDescription || 'Explore this project on GitHub.'));
    if (meta.childNodes.length) article.append(meta);
    const tags = element('ul', 'tags');
    tags.setAttribute('aria-label', 'Technologies');
    const technologies = list(project.technologies);
    (technologies.length ? technologies : list(project.programmingLanguages)).forEach(tag => tags.append(element('li', '', tag)));
    article.append(tags);
    const links = element('div', 'card-links');
    const repo = safeUrl(project.repositoryUrl);
    const demo = safeUrl(project.demoUrl);
    if (repo) links.append(link('View source ↗', repo));
    if (demo) links.append(link('Try it live ↗', demo, 'demo-link'));
    if (!demo && project.slug === 'fitai') links.append(link('Explore live preview ↗', new URL('fitai-preview/index.html?mode=yoga', document.baseURI).href, 'demo-link'));
    if (!demo && project.slug === 'moderized-china-art-2d') links.append(link('Explore live preview ↗', new URL(livePreviews[project.slug], document.baseURI).href, 'demo-link'));
    const screenshot = safeUrl(project.screenshotUrl);
    if (screenshot) links.append(link('View project screenshot ↗', screenshot));
    article.append(links);
    if (project.longDescription || list(project.domainTags).length || list(project.schoolSubjects).length || list(project.limitations).length) {
      const details = element('details');
      details.append(element('summary', '', 'About this project'));
      if (project.longDescription) details.append(element('p', '', project.longDescription));
      if (list(project.domainTags).length) {
        const topics = element('p');
        topics.append(element('span', 'detail-label', 'Exploring'), document.createTextNode(list(project.domainTags).map(tag => tag.replaceAll('-', ' ')).join(' · ')));
        details.append(topics);
      }
      if (list(project.schoolSubjects).length) {
        const subjects = element('p');
        subjects.append(element('span', 'detail-label', 'Related subjects'), document.createTextNode(list(project.schoolSubjects).join(' · ')));
        details.append(subjects);
      }
      if (list(project.limitations).length) {
        const notes = element('p');
        notes.append(element('span', 'detail-label', 'Project notes'), document.createTextNode(list(project.limitations).join(' ')));
        details.append(notes);
      }
      article.append(details);
    }
    return article;
  }

  window.addEventListener('message', event => {
    if (event.origin !== location.origin || !['fitai-preview', 'zhong-art-preview'].includes(event.data?.type) || event.data.event !== 'ready') return;
    const frame = [...grid.querySelectorAll('.project-live-preview[src]')].find(node => node.contentWindow === event.source);
    frame?.closest('.project-art')?.classList.add('preview-ready');
  });

  function watchPreviews() {
    previewObserver?.disconnect();
    previewObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target: frame, isIntersecting }) => {
        if (isIntersecting && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
        else if (!isIntersecting && frame.hasAttribute('src')) {
          frame.removeAttribute('src');
          frame.closest('.project-art').classList.remove('preview-ready');
        }
      });
    }, { rootMargin: '120px 0px' });
    grid.querySelectorAll('.project-live-preview').forEach(frame => previewObserver.observe(frame));
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = projects.filter(project => {
      const text = [project.title, project.shortDescription, project.longDescription, ...list(project.technologies), ...list(project.programmingLanguages), ...list(project.domainTags), ...list(project.schoolSubjects), ...list(project.topics)].join(' ').toLocaleLowerCase();
      return !query || text.includes(query);
    });
    if (sort.value === 'recent') visible.sort((a, b) => dateValue(b) - dateValue(a));
    if (sort.value === 'title') visible.sort((a, b) => a.title.localeCompare(b.title));
    previewObserver?.disconnect();
    grid.replaceChildren(...visible.map(card));
    watchPreviews();
    count.textContent = `${visible.length} of ${projects.length} projects`;
    empty.hidden = visible.length !== 0;
  }

  function setup() {
    const stats = document.querySelector('#collection-stats');
    stats.replaceChildren();
    [[projects.length, 'Projects'], [projects.filter(project => safeUrl(project.demoUrl)).length, 'Live demos']].forEach(([value, label]) => {
      const stat = element('div', 'stat');
      stat.append(element('strong', '', String(value).padStart(2, '0')), element('span', '', label));
      stats.append(stat);
    });
    document.querySelector('#controls').hidden = false;
    render();
  }

  async function load() {
    error.hidden = true;
    empty.hidden = true;
    grid.setAttribute('aria-busy', 'true');
    count.textContent = 'Loading the collection…';
    try {
      const collections = await Promise.all(['data/git-projects.json', 'data/study-projects.json'].map(async url => {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const collection = await response.json();
        if (!Array.isArray(collection)) throw new Error('Invalid project collection');
        return collection;
      }));
      const data = collections.flat();
      if (!Array.isArray(data) || data.some(project => !project || typeof project.title !== 'string')) throw new Error('Invalid project collection');
      projects = [...data].sort((a, b) =>
        categoryRank(a.category) - categoryRank(b.category) ||
        (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)
      ).map((project, collectionIndex) => ({ ...project, category: project.category || 'Other projects', collectionIndex }));
      setup();
    } catch {
      count.textContent = 'Collection unavailable';
      error.hidden = false;
      if (location.protocol === 'file:') error.querySelector('p').textContent = 'Open this page through a local web server to load the project data.';
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }

  search.addEventListener('input', render);
  sort.addEventListener('change', render);
  document.querySelector('#reset').addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  document.querySelector('#retry').addEventListener('click', load);
  load();
})();
