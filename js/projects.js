(() => {
  'use strict';

  const grid = document.querySelector('#project-grid');
  const count = document.querySelector('#result-count');
  const search = document.querySelector('#search');
  const sort = document.querySelector('#sort');
  const filters = document.querySelector('#filters');
  const empty = document.querySelector('#empty-state');
  const error = document.querySelector('#error-state');
  let projects = [];
  let category = '';
  const projectCovers = {
    'ai-hands': 'assets/images/projects/handsCard.png',
    'grid-1': 'assets/images/projects/grid-1.jpg',
    'grid-2': 'assets/images/projects/grid-2.jpg',
    'walker': 'assets/images/projects/walkerCard.png'
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

  function card(project) {
    const article = element('article', 'project-card');
    const art = element('div', `project-art art-${project.collectionIndex % 7}`);
    // Prefer catalog artwork, then an existing project screenshot.
    art.append(element('span', 'art-label', 'Project study'), element('span', 'art-number', String(project.collectionIndex + 1).padStart(2, '0')));
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
    const meta = element('div', 'card-meta');
    meta.append(element('span', '', project.category || 'Other projects'));
    if (dateValue(project)) {
      const date = new Date(dateValue(project));
      const time = element('time', '', date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }));
      time.dateTime = date.toISOString();
      time.title = 'Last updated';
      meta.append(time);
    }
    article.append(art, meta, element('h3', '', project.title), element('p', 'description', project.shortDescription || 'Explore this project on GitHub.'));
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

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = projects.filter(project => {
      const text = [project.title, project.shortDescription, project.longDescription, project.category, ...list(project.technologies), ...list(project.programmingLanguages), ...list(project.domainTags), ...list(project.schoolSubjects), ...list(project.topics)].join(' ').toLocaleLowerCase();
      return (!category || project.category === category) && (!query || text.includes(query));
    });
    if (sort.value === 'recent') visible.sort((a, b) => dateValue(b) - dateValue(a));
    if (sort.value === 'title') visible.sort((a, b) => a.title.localeCompare(b.title));
    grid.replaceChildren(...visible.map(card));
    count.textContent = `${visible.length} of ${projects.length} projects${category ? ` / ${category}` : ''}`;
    empty.hidden = visible.length !== 0;
    filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  }

  function setup() {
    const categories = [...new Set(projects.map(project => project.category))];
    filters.replaceChildren();
    ['', ...categories].forEach(value => {
      const button = element('button', '', value || 'All projects');
      button.type = 'button';
      button.dataset.category = value;
      button.append(element('span', 'filter-count', String(value ? projects.filter(project => project.category === value).length : projects.length)));
      button.addEventListener('click', () => { category = value; render(); });
      filters.append(button);
    });
    const stats = document.querySelector('#collection-stats');
    stats.replaceChildren();
    [[projects.length, 'Projects'], [categories.length, 'Categories'], [projects.filter(project => safeUrl(project.demoUrl)).length, 'Live demos']].forEach(([value, label]) => {
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
      const response = await fetch('data/git-projects.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.some(project => !project || typeof project.title !== 'string')) throw new Error('Invalid project collection');
      projects = [...data].sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)).map((project, collectionIndex) => ({ ...project, category: project.category || 'Other projects', collectionIndex }));
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
  document.querySelector('#reset').addEventListener('click', () => { search.value = ''; category = ''; render(); search.focus(); });
  document.querySelector('#retry').addEventListener('click', load);
  load();
})();
