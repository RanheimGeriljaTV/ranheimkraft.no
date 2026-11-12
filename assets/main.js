/**
 * Ranheim Kraft – Main Script
 * Handles YouTube Cinema Player and mascot hover
 */

// 1. Mascot: sleeping bear on hover (preloaded so it doesn't flicker)
(function initMascot() {
  const bear = document.getElementById('mascot-bear');
  if (!bear || !bear.dataset.sleepSrc) return;
  const awakeSrc = bear.getAttribute('src');
  const sleepSrc = bear.dataset.sleepSrc;
  new Image().src = sleepSrc;
  bear.addEventListener('mouseenter', () => { bear.src = sleepSrc; });
  bear.addEventListener('mouseleave', () => { bear.src = awakeSrc; });
})();

// 2. Ranheim Gerilja TV Archive
const GERILJA_VIDEOS = [
  { id: 'Ac-0DqaUDfM', title: '🚨 STOR AVSLØRING FRA RANHEIM GERILJA TV!' },
  { id: '0u1F3hwLfhU', title: 'Besøk hos Vår Frue Åpen kirke' },
  { id: '1Ci_oXPDKiw', title: 'Truls & Ranheim Gerilja TV' },
  { id: 'PN9fyJ4dxUk', title: 'Ranheim Gerilja TV - Heng et stykke ribbe' },
  { id: '95C6-XZLxbE', title: 'Førjulsprat med Eva Hansen' },
  { id: 'iVUI7lyTGnw', title: 'På Veien for en God Sak: Tour de Trøndelag' },
  { id: 'JR7jvYASRR0', title: 'Timelapse Tour de Trøndelag' },
  { id: 'n7J-a7kZRkA', title: 'Løypa til Tour De Trøndelag' },
  { id: 'eS5ZUZBtYVc', title: 'Teaser Tour de Trøndelag' },
  { id: '1lHuPsJkRuM', title: 'Årets supporter' },
  { id: '2d5css3-v8o', title: 'Ranheim Gerilja TV Spesial' }
];

let currentVideo = GERILJA_VIDEOS[Math.floor(Math.random() * GERILJA_VIDEOS.length)];
let ytPlayer = null;
let ytApiReady = false;
let isSoundOn = false;

// Called automatically by YouTube IFrame API
window.onYouTubeIframeAPIReady = function() {
  ytApiReady = true;
  initPlayer();
};

function initPlayer() {
  if (!currentVideo) currentVideo = GERILJA_VIDEOS[0];
  const target = document.getElementById('yt-player-target');
  if (!target || !window.YT || !YT.Player) return;

  ytPlayer = new YT.Player('yt-player-target', {
    videoId: currentVideo.id,
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      loop: 1,
      playlist: currentVideo.id,
      iv_load_policy: 3,
      disablekb: 1
    },
    events: {
      onReady: function(e) {
        e.target.mute();
        e.target.playVideo();
      }
    }
  });
  updateVideoDetails();
}

// Fallback in case YouTube Iframe API finished loading before this script
if (window.YT && window.YT.Player) {
  initPlayer();
}

// Toggle Sound (Mute / Unmute)
function toggleSound(e) {
  if (e) e.stopPropagation();
  if (!ytPlayer) return;

  const btn = document.getElementById('sound-toggle');
  const icon = document.getElementById('sound-icon');
  const text = document.getElementById('sound-text');

  if (ytPlayer.isMuted()) {
    ytPlayer.unMute();
    ytPlayer.setVolume(100);
    isSoundOn = true;
    if (icon) icon.textContent = '🔊';
    if (text) text.textContent = 'Mute';
  } else {
    ytPlayer.mute();
    isSoundOn = false;
    if (icon) icon.textContent = '🔇';
    if (text) text.textContent = 'Slå på lyd';
  }

  if (btn) {
    btn.setAttribute('aria-pressed', String(isSoundOn));
    btn.setAttribute('aria-label', isSoundOn ? 'Slå av lyd' : 'Slå på lyd');
  }
}

// Selects a random video on dice click (no YouTube UI)
function pickRandomVideo() {
  let available = GERILJA_VIDEOS;
  if (currentVideo && GERILJA_VIDEOS.length > 1) {
    available = GERILJA_VIDEOS.filter(v => v.id !== currentVideo.id);
  }
  currentVideo = available[Math.floor(Math.random() * available.length)];

  if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById({
      videoId: currentVideo.id,
      startSeconds: 0
    });
    if (!isSoundOn) ytPlayer.mute();
  }
  updateVideoDetails();
}

function updateVideoDetails() {
  const titleEl = document.getElementById('current-video-title');
  const linkEl = document.getElementById('current-video-link');
  if (titleEl && currentVideo) titleEl.textContent = currentVideo.title;
  if (linkEl && currentVideo) linkEl.href = 'https://www.youtube.com/watch?v=' + currentVideo.id;
}

updateVideoDetails();

// Knapper på forsiden (ingen inline-handlere, så en streng CSP er mulig)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'random-video') pickRandomVideo();
  if (el.dataset.action === 'toggle-sound') toggleSound(e);
});
