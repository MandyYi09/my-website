import { c as createExperience } from '../little-mandy/assets/experience-f4yhIQOI.js?v=chapter-order-2';

// Portfolio copy lives here and in about.html; the standalone Little Mandy stays independent.
const $ = (selector) => document.querySelector(selector);
const chapters = {
  hello: { number: '01 / THE EVERYDAY ME', title: 'Mandy Yi' },
  rowing: { number: '02 / ON THE WATER', title: 'Rowing' },
  teach: { number: '03 / IN MY ELEMENT', title: 'Academic Passion' },
  photography: { number: '04 / THROUGH MY LENS', title: 'Photography' },
  tennis: { number: '05 / ON THE COURT', title: 'Tennis' },
};
const pauseIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const playIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6z" fill="currentColor"/></svg>';
const timeLabel = (time) => `00:${Math.floor(time).toString().padStart(2, '0')}`;
let currentChapter;
let wasPlaying;

function showChapter(chapter) {
  if (!chapters[chapter] || currentChapter === chapter) return;
  $('#scene-number').textContent = chapters[chapter].number;
  $('#scene-title').textContent = chapters[chapter].title;
  $('.world').dataset.scene = chapter;
  document.querySelectorAll('[data-scene]').forEach((panel) => {
    panel.hidden = panel.dataset.scene !== chapter;
  });
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
      chapterOrder: Object.keys(chapters),
      onProgress: ({ time, duration, playing, chapter }) => {
        $('#progress-fill').style.width = `${time / duration * 100}%`;
        $('#player-time').textContent = `${timeLabel(time)} / ${timeLabel(duration)}`;
        $('.progress-track').setAttribute('aria-valuenow', time.toFixed(1));
        $('.progress-track').setAttribute('aria-valuemax', String(duration));
        if (wasPlaying !== playing) {
          $('#play-toggle').innerHTML = playing ? pauseIcon : playIcon;
          $('#play-toggle').setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
          wasPlaying = playing;
        }
        showChapter(chapter);
      },
    });
    window.mandy = experience;
    $('#loader').classList.add('hidden');
    document.querySelectorAll('[data-activity]').forEach((button) => {
      button.addEventListener('click', () => {
        experience.play(button.dataset.activity);
        showChapter(button.dataset.activity);
        $('#sequence-button').classList.remove('active');
        $('#sequence-button').setAttribute('aria-pressed', 'false');
        $('#player-title').textContent = chapters[button.dataset.activity].title;
        $('#player-caption').textContent = 'ONE LITTLE MOMENT · ON REPEAT';
      });
    });
    $('#sequence-button').addEventListener('click', () => {
      experience.play('story');
      $('#sequence-button').classList.add('active');
      $('#sequence-button').setAttribute('aria-pressed', 'true');
      $('#player-title').textContent = 'A day in my little world';
      $('#player-caption').textContent = 'HELLO → ROWING → LEARN → PHOTO → TENNIS';
    });
    $('#play-toggle').addEventListener('click', () => experience.toggle());
    $('#reset-view').addEventListener('click', experience.resetCamera);
    $('#zoom-in').addEventListener('click', experience.zoomIn);
    $('#zoom-out').addEventListener('click', experience.zoomOut);
  } catch (error) {
    console.error(error);
    $('#loader').innerHTML = '<span class="loader-flower">✳</span><p>The 3D scene couldn’t load. Please refresh in a browser with WebGL enabled.</p>';
    // Keep all supplied copy accessible if WebGL is unavailable.
    document.querySelectorAll('[data-activity]').forEach((button) => {
      button.addEventListener('click', () => showChapter(button.dataset.activity));
    });
    $('.world').classList.add('scene-unavailable');
  }
}
init();
