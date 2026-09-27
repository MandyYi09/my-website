import PhotoSwipeLightbox from '../libs/photoswipe/photoswipe-lightbox.esm.min.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lightbox = new PhotoSwipeLightbox({
  gallery: '#photo-gallery',
  children: 'a.ph',
  pswpModule: () => import('../libs/photoswipe/photoswipe.esm.min.js'),
  showHideAnimationType: 'fade',
  showAnimationDuration: reducedMotion ? 0 : 250,
  hideAnimationDuration: reducedMotion ? 0 : 250,
  zoomAnimationDuration: reducedMotion ? 0 : 250,
  padding: { top: 60, bottom: 70, left: 16, right: 16 }
});

lightbox.on('uiRegister', () => {
  lightbox.pswp.ui.registerElement({
    name: 'photo-caption',
    order: 9,
    isButton: false,
    appendTo: 'root',
    onInit: (element, pswp) => {
      pswp.on('change', () => {
        element.textContent = pswp.currSlide.data.element
          ?.querySelector('.ph-label')?.textContent.trim() || '';
      });
    }
  });
});

lightbox.init();
