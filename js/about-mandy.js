import { c as createExperience } from '../little-mandy/assets/experience-D680w8GR.js';

const $ = (selector) => document.querySelector(selector);
const chapterOrder = ['hello', 'rowing', 'teach', 'photography', 'tennis'];
let currentChapter;

function showChapter(chapter) {
  if (!chapterOrder.includes(chapter) || currentChapter === chapter) return;
  document.querySelectorAll('[data-activity]').forEach((button) => {
    const selected = button.dataset.activity === chapter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  currentChapter = chapter;
}

async function init() {
  try {
    const experience = await createExperience($('#viewer'), {
      chapterOrder,
      onProgress: ({ chapter }) => showChapter(chapter),
    });
    window.mandy = experience;
    $('#loader').classList.add('hidden');
    document.querySelectorAll('[data-activity]').forEach((button) => {
      button.addEventListener('click', () => {
        experience.play(button.dataset.activity);
        showChapter(button.dataset.activity);
      });
    });
  } catch (error) {
    console.error(error);
    $('#loader').innerHTML = '<span class="loader-flower">✳</span><p>The 3D scene couldn’t load. Please refresh in a browser with WebGL enabled.</p>';
    $('#loader').setAttribute('role', 'alert');
    $('#loader').removeAttribute('aria-label');
    $('.world').classList.add('scene-unavailable');
  }
}
init();
