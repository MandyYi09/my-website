(() => {
  const projects = new Map([
    ['walker', { title: 'Walking Code', src: 'https://mandyyi09.github.io/walker/' }],
    ['grid-1', { title: 'Grid 1', src: 'https://mandyyi09.github.io/grid-1/' }],
    ['zhong-art', { title: 'Zhong Art', src: 'zhong-art-project/' }],
    ['fitai', { title: 'FitAI', src: 'fitai-project/index.html' }]
  ]);
  const id = new URLSearchParams(location.search).get('project');
  const project = projects.get(id);
  if (!project) return;
  const back = document.getElementById('project-back');
  const home = new URL('index.html', location.href);
  home.searchParams.set('slide', id);
  home.hash = 'home';
  back.href = home.href;
  document.title = `${project.title} — Mandy`;
  document.getElementById('project-name').textContent = project.title;
  const frame = document.getElementById('project-frame');
  const message = document.getElementById('project-message');
  if (location.protocol === 'file:' && !/^https?:/.test(project.src)) {
    message.textContent = 'Opening the project in your local preview…';
    const unavailable = () => {
      message.textContent = 'Open “Preview Portfolio.command” in the website folder, then refresh this page to view the complete project.';
    };
    const config = document.createElement('script');
    config.src = 'js/local-preview-origin.js';
    config.onerror = unavailable;
    config.onload = () => {
      let origin;
      try {
        origin = new URL(window.portfolioPreviewOrigin);
        if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1') throw new Error('Invalid preview address');
      } catch { unavailable(); return; }
      const probe = document.createElement('script');
      let settled = false;
      const fail = () => { if (!settled) { settled = true; unavailable(); } };
      const timeout = setTimeout(fail, 2500);
      probe.src = new URL('js/local-preview-origin.js', origin).href + '?ready=' + Date.now();
      probe.onerror = () => { clearTimeout(timeout); fail(); };
      probe.onload = () => {
        clearTimeout(timeout);
        if (settled) return;
        settled = true;
        const viewer = new URL('project.html', origin);
        viewer.searchParams.set('project', id);
        location.replace(viewer.href);
      };
      document.head.append(probe);
    };
    document.head.append(config);
    return;
  }
  frame.title = `${project.title} project`;
  frame.src = project.src;
  frame.hidden = false;
  message.hidden = true;
})();
