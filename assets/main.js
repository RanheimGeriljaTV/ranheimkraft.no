/**
 * Ranheim Kraft – Main Script
 * Handles YouTube Cinema Player, mascot hover & Live Ranheim Fotball RSS News Ticker
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

// 3. Dynamic Live News Fetcher (Ranheim Fotball) - Real-time RSS with fallback

// Only accept plain https links (blocks javascript:, data: etc. from the external feed)
function safeHttpsUrl(raw) {
  try {
    const url = new URL(String(raw || '').trim());
    return url.protocol === 'https:' ? url.href : null;
  } catch (e) {
    return null;
  }
}

const TICKER_ARROW_PATH = 'M14 5l7 7m0 0l-7 7m7-7H3';

// Builds one ticker link with DOM APIs (no innerHTML), so feed text is never parsed as HTML
function buildTickerItem(item, isDuplicate) {
  const a = document.createElement('a');
  a.href = item.link;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'inline-flex items-center gap-1.5 sm:gap-2.5 py-0.5 sm:py-1 text-slate-100 hover:text-cyan-300 transition-colors text-[11px] sm:text-xs md:text-sm font-medium tracking-wide group/tickeritem';
  if (isDuplicate) {
    // The second copy only exists for the seamless loop: hide it from screen readers and tab order
    a.setAttribute('aria-hidden', 'true');
    a.tabIndex = -1;
  }

  const bullet = document.createElement('span');
  bullet.className = 'text-cyan-400 font-black text-xs sm:text-sm';
  bullet.setAttribute('aria-hidden', 'true');
  bullet.textContent = '•';

  const title = document.createElement('span');
  title.className = 'hover:underline';
  title.textContent = item.title;

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400/80 group-hover/tickeritem:translate-x-0.5 group-hover/tickeritem:-translate-y-0.5 transition-transform');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svgNs, 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('d', TICKER_ARROW_PATH);
  svg.appendChild(path);

  a.append(bullet, title, svg);
  return a;
}

function normalizeNewsItems(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(it => ({
      title: String((it && it.title) || '').trim(),
      link: safeHttpsUrl(it && it.link)
    }))
    .filter(it => it.title && it.link);
}

async function loadLiveNews() {
  let items = [];

  // 1. Live real-time RSS fetch via RSS-to-JSON bridge
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.ranheimfotball.no%2Frss-nyheter', {
      signal: ctrl.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'ok') {
        items = normalizeNewsItems(data.items);
      }
    }
  } catch (e) {
    // Fallback to static news cache if network or proxy fails
  }

  // 2. Fallback to cached assets/news.json if live fetch was unavailable
  if (items.length === 0) {
    try {
      const res = await fetch('assets/news.json?v=' + Date.now());
      if (res.ok) {
        items = normalizeNewsItems(await res.json());
      }
    } catch (e) {}
  }

  // 3. Render ticker items (de 8 ferskeste, duplisert for sømløs loop)
  if (items.length === 0) return;
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const freshNews = items.slice(0, 8);
  const fragment = document.createDocumentFragment();
  freshNews.forEach(item => fragment.appendChild(buildTickerItem(item, false)));
  freshNews.forEach(item => fragment.appendChild(buildTickerItem(item, true)));
  track.replaceChildren(fragment);
}

// Start fetching live news immediately
loadLiveNews();
