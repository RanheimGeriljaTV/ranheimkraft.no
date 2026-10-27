/**
 * Ranheim Kraft – Main Script
 * Handles YouTube Cinema Player & Live Ranheim Fotball RSS News Ticker
 */

// 1. Dynamic Current Year
document.addEventListener('DOMContentLoaded', () => {
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
});

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
async function loadLiveNews() {
  let items = null;

  // 1. Live real-time RSS fetch via high-speed CORS proxy
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch('https://r.jina.ai/https://www.ranheimfotball.no/rss-nyheter', {
      headers: { 'x-respond-with': 'text' },
      signal: ctrl.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const xmlText = await res.text();
      const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      const parsed = Array.from(xml.querySelectorAll('item')).map(it => ({
        title: it.querySelector('title')?.textContent?.trim() || '',
        link: it.querySelector('link')?.textContent?.trim() || ''
      })).filter(it => it.title && it.link);

      if (parsed.length > 0) {
        items = parsed;
      }
    }
  } catch (e) {
    // Fallback to static news cache if network or proxy fails
  }

  // 2. Fallback to cached assets/news.json if live fetch was unavailable
  if (!items) {
    try {
      const res = await fetch('assets/news.json?v=' + Date.now());
      if (res.ok) {
        items = await res.json();
      }
    } catch (e) {}
  }

  // 3. Render ticker items (Begrens til 8 ferskeste og tilpass farten for rolig lesing)
  if (items && Array.isArray(items) && items.length > 0) {
    const track = document.getElementById('ticker-track');
    if (!track) return;

    // Bruk de 8 ferskeste nyhetene for en ren og relevant nyhetsstripe
    const freshNews = items.slice(0, 8);
    const renderList = [...freshNews, ...freshNews];
    track.innerHTML = renderList.map(item => `
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 sm:gap-2.5 py-0.5 sm:py-1 text-slate-100 hover:text-cyan-300 transition-colors text-[11px] sm:text-xs md:text-sm font-medium tracking-wide group/tickeritem">
        <span class="text-cyan-400 font-black text-xs sm:text-sm">&bull;</span>
        <span class="hover:underline">${item.title}</span>
        <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400/80 group-hover/tickeritem:translate-x-0.5 group-hover/tickeritem:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </a>
    `).join('');

    // Beregn en rolig og behagelig lesehastighet (ca. 45 piksler per sekund)
    requestAnimationFrame(() => {
      const halfWidth = track.scrollWidth / 2;
      const duration = Math.max(35, Math.round(halfWidth / 54));
      track.style.animationDuration = `${duration}s`;
    });
  }
}

// Start fetching live news immediately
loadLiveNews();

// 4. Desktop-Only Subtle Card Hover Glow (No Gyroscope, Touch-Safe)
function initCardHover() {
  // Completely disable on mobile and touch devices
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  const cards = document.querySelectorAll('.bento-tile');
  if (!cards.length) return;

  // Insert subtle light reflection sheen into each card
  cards.forEach(card => {
    if (!card.querySelector('.holo-foil')) {
      const foil = document.createElement('div');
      foil.className = 'holo-foil';
      card.appendChild(foil);
    }
  });

  // Desktop Mouse Move: Very subtle, smooth spotlight reflection (no aggressive 3D tilt)
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const maxTilt = 3.5;
      const rotateX = -(y - 0.5) * 2 * maxTilt;
      const rotateY = (x - 0.5) * 2 * maxTilt;

      card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
      card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
      card.style.setProperty('--holo-opacity', '1');
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--holo-opacity', '0');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardHover);
} else {
  initCardHover();
}
