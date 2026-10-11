(() => {
  if (new URLSearchParams(location.search).get('slide') !== 'photography') return;
  const back = document.querySelector('.site-nav .brand');
  if (!back) return;
  back.href = 'index.html?slide=photography#home';
  back.textContent = '← Back to home';
  back.classList.add('carousel-return');
  back.setAttribute('aria-label', 'Back to the photography slide on the homepage');
})();
