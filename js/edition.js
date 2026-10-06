(() => {
  const sportStage = document.querySelector('.sports-stage');
  document.querySelectorAll('[data-sport]').forEach(button => {
    button.addEventListener('click', () => {
      const tennis = button.dataset.sport === 'tennis';
      sportStage.classList.toggle('is-tennis', tennis);
      document.querySelectorAll('[data-sport]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelector('#sport-story').innerHTML = tennis
        ? 'One point. A fresh start.<br>Find your focus in the next rally.'
        : 'One stroke. Then the next.<br>Everything else gets a little quieter.';
      document.querySelector('.sport-coordinate').textContent = tennis ? 'On the court / Tennis' : 'On the water / Rowing';
    });
  });
  document.querySelectorAll('[data-photo-layout]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('#photo-gallery').classList.toggle('is-contact', button.dataset.photoLayout === 'contact');
      document.querySelectorAll('[data-photo-layout]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
  const atlas = {
    move: { image:'assets/images/sports/rowing/rowing.JPG', alt:'Rowing on the water at sunset', caption:'01 / Finding a rhythm', story:'Tennis and rowing: effort, focus, routine, and the changes that come from staying with something.', href:'sports.html', link:'Explore sport ↗' },
    make: { image:'assets/images/projects/grid-1/grid-1.jpg', alt:'A colorful generative line pattern from Grid 1', caption:'02 / An idea made visible', story:'Creative coding, interactive art, and the process of turning an idea into something I can test. Small rules can lead somewhere unexpected.', href:'projects.html', link:'Explore my projects ↗' },
    notice: { image:'assets/images/photography/sunset-La Jolla.jpg', alt:'Sunset photographed in La Jolla', caption:'03 / A moment worth keeping', story:'Photography is a way to slow down and notice light, places, and small details. A practice in looking a little closer.', href:'photography.html', link:'View photographs ↗' }
  };
  document.querySelectorAll('[data-atlas]').forEach(button => {
    button.addEventListener('click', () => {
      const data=atlas[button.dataset.atlas], image=document.querySelector('#atlas-image');
      image.src=data.image;image.alt=data.alt;
      document.querySelector('#atlas-caption').textContent=data.caption;
      document.querySelector('#atlas-story').textContent=data.story;
      const link=document.querySelector('#atlas-link');link.href=data.href;link.textContent=data.link;
      document.querySelectorAll('[data-atlas]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    });
  });
})();
