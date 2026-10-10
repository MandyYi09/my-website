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
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
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
    if (visit) result.append(externalLink('Visit project ↗', visit, 'visit-link'));
    if (repo) result.append(externalLink('GitHub ↗', repo, 'github-link'));
    return result;
  }
  function openDetails(project) {
    document.querySelector('#dialog-category').textContent = project.category || 'Project';
    content.replaceChildren();
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
    const body = node('div', 'project-card-body');
    body.append(node('span', 'project-category', project.category || 'Project'));
    body.append(node('h2', '', project.title));
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
    grid.replaceChildren(...visible.map(card));
    count.textContent = query ? visible.length + ' of ' + projects.length + ' projects' : projects.length + ' projects';
    empty.hidden = visible.length !== 0;
  }
  async function load() {
    error.hidden = true;
    empty.hidden = true;
    grid.setAttribute('aria-busy', 'true');
    count.textContent = 'Loading projects…';
    try {
      const collections = await Promise.all(['data/git-projects.json', 'data/study-projects.json'].map(async path => {
        const response = await fetch(path, { cache: 'no-cache' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const collection = await response.json();
        if (!Array.isArray(collection)) throw new Error('Invalid project collection');
        return collection;
      }));
      const data = collections.flat();
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
      if (location.protocol === 'file:') error.querySelector('p').textContent = 'Open this page through a local web server to load the project data.';
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }
  search.addEventListener('input', render);
  document.querySelector('#reset').addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  document.querySelector('#retry').addEventListener('click', load);
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  load();
})();
