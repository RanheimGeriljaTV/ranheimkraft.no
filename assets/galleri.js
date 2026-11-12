/**
 * Ranheim Kraft – Bildegalleri (galleri.html)
 * Henter gallerier fra Google Apps Script, håndterer passord, rutenett og lightbox.
 * Demomodus: åpne galleri.html?demo=1
 */
// Escaper tekst før den settes inn i HTML (titler/filnavn kommer fra regneark og Google Disk)
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Fokushåndtering for dialoger (tastatur og skjermleser)
let lastFocusedEl = null;

function rememberFocus() {
  lastFocusedEl = document.activeElement;
}

function restoreFocus() {
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  lastFocusedEl = null;
}

// Holder Tab-fokus inne i en åpen dialog
function trapFocus(e, container) {
  if (e.key !== 'Tab') return;
  const focusables = Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter(el => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* =====================================================================
   KONFIGURASJON:
   Google Apps Script Nettapp-URL.
   ===================================================================== */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGmkFmROkW39rHdvkmliYypX9Raj5eTXanvMBVCNn0RQsTemFlayRtklv4dtc5vMwddA/exec';

// Demomodus er eksplisitt: åpne galleri.html?demo=1. Da brukes eksempelgallerier og demopassord
// (både for lista og for opplåsing). Ellers snakker siden alltid med den ekte backenden.
const DEMO = new URLSearchParams(location.search).has('demo');

// In-memory state
let allGalleries = [];
let currentGallery = null;
let pendingGalleryId = null;
let currentPhotos = [];
let currentPhotoIndex = 0;

// Demonstration fallback data
const DEMO_GALLERIES = [
  {
    id: 'ranheim-vs-bryne-2026',
    title: 'Ranheim vs. Bryne (4–2)',
    date: '2026-10-18',
    description: 'Målfest og drama i fjæra. Ekstraomganger og feiring foran supporterne.',
    locked: true,
    count: 42
  },
  {
    id: 'tour-de-trondelag-2026',
    title: 'Tour de Trøndelag – Bak kulissene',
    date: '2026-09-04',
    description: 'Eksklusive bilder fra opptak og ritt med Ranheim Gerilja TV-teamet.',
    locked: true,
    count: 28
  },
  {
    id: 'ranheim-gatelag-gull-2026',
    title: 'Seriegull for Ranheim Gatelag!',
    date: '2026-10-09',
    description: 'Avslutning og jubelscener fra Ulsteinvik da seriemesterskapet ble sikret.',
    locked: false,
    count: 19
  }
];

function getDemoPhotos(galleryId) {
  const samples = [
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
    'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80'
  ];
  return samples.map((url, i) => ({
    id: `demo-${i + 1}`,
    name: `Bilde_${String(i + 1).padStart(3, '0')}.jpg`,
    thumbUrl: url,
    fullUrl: url.replace('w=800', 'w=1600'),
    downloadUrl: url
  }));
}

// 1. Load galleries list from Apps Script (or fallback)
async function loadGalleries() {
  const loader = document.getElementById('list-loader');
  const errBox = document.getElementById('list-error');
  const grid = document.getElementById('galleries-grid');

  loader.classList.remove('hidden');
  errBox.classList.add('hidden');
  grid.innerHTML = '';

  if (DEMO) {
    setTimeout(() => {
      loader.classList.add('hidden');
      allGalleries = DEMO_GALLERIES;
      renderGalleries(allGalleries, true);
    }, 300);
    return;
  }

  if (!APPS_SCRIPT_URL) {
    loader.classList.add('hidden');
    allGalleries = [];
    grid.innerHTML = `
      <div class="col-span-full p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
        <div class="font-syne font-bold text-2xl text-white">Kommer snart</div>
        <p class="text-xs text-zinc-400">Galleriene er under oppsett. Ta kontakt hvis du venter på bilder.</p>
      </div>`;
    return;
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL + '?t=' + Date.now());
    const data = await res.json();
    loader.classList.add('hidden');

    if (data.ok && Array.isArray(data.galleries)) {
      allGalleries = data.galleries;
      renderGalleries(allGalleries, false);
    } else {
      showListError(data.error || 'Kunne ikke hente gallerier fra Google Disk.');
    }
  } catch (err) {
    loader.classList.add('hidden');
    console.warn('Apps Script kontakt feilet', err);
    showListError('Klarte ikke hente gallerier akkurat nå. Prøv å laste siden på nytt om litt.');
  }
}

// 2. Render Gallery Cards (Swiss Kinetic Minimalist Style)
function renderGalleries(list, isDemo) {
  const grid = document.getElementById('galleries-grid');
  grid.innerHTML = '';

  if (isDemo) {
    const banner = document.createElement('div');
    banner.className = 'col-span-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2';
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
        <span><strong>Demomodus (?demo=1):</strong> Viser eksempelgallerier.</span>
      </div>
      <span class="text-zinc-400">Passord for eksemplene: <code class="text-white bg-white/10 px-1.5 py-0.5 rounded">ranheim</code></span>
    `;
    grid.appendChild(banner);
  }

  list.forEach((g, idx) => {
    const card = document.createElement('article');
    card.className = 'p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 transition flex flex-col justify-between cursor-pointer group space-y-5';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${g.locked ? 'Låst galleri' : 'Åpent galleri'}: ${g.title || ''}`);
    card.onclick = () => requestOpenGallery(g.id);
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        requestOpenGallery(g.id);
      }
    };

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold ${g.locked ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'}">
            ${g.locked ? '🔒 Passord' : '🔓 Åpen'}
          </span>
          <span class="text-xs text-zinc-400 font-mono">${escapeHtml(g.date || '')}</span>
        </div>

        <h3 class="text-xl font-syne font-bold text-white group-hover:text-cyan-400 transition leading-snug">
          ${escapeHtml(g.title)}
        </h3>

        <p class="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          ${escapeHtml(g.description || 'Klikk for å låse opp og se bildene.')}
        </p>
      </div>

      <div class="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <span class="text-zinc-400 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>${g.count ? escapeHtml(g.count) + ' bilder' : 'Bildegalleri'}</span>
        </span>

        <span class="text-white font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
          <span>Åpne</span> &rarr;
        </span>
      </div>
    `;

    grid.appendChild(card);
  });
}

function showListError(msg) {
  const errBox = document.getElementById('list-error');
  errBox.textContent = msg;
  errBox.classList.remove('hidden');
}

// 3. Request to Open a Gallery
function requestOpenGallery(galleryId) {
  const g = allGalleries.find(x => x.id === galleryId);
  if (!g) return;

  if (!g.locked) {
    unlockGallery(galleryId, '');
  } else {
    pendingGalleryId = galleryId;
    rememberFocus();
    document.getElementById('modal-gallery-name').textContent = g.title;
    document.getElementById('input-password').value = '';
    document.getElementById('modal-password').classList.remove('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    setTimeout(() => document.getElementById('input-password').focus(), 100);
  }
}

function closePasswordModal() {
  const modal = document.getElementById('modal-password');
  const wasOpen = !modal.classList.contains('hidden');
  modal.classList.add('hidden');
  pendingGalleryId = null;
  if (wasOpen) restoreFocus();
}

function togglePasswordVisibility() {
  const input = document.getElementById('input-password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// 4. Submit Password
async function submitPassword(e) {
  e.preventDefault();

  const pwd = document.getElementById('input-password').value;
  const btn = document.getElementById('btn-submit-pwd');
  const errBox = document.getElementById('modal-error');

  btn.disabled = true;
  btn.innerHTML = `<span class="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Sjekker...`;
  errBox.classList.add('hidden');

  await unlockGallery(pendingGalleryId, pwd);

  btn.disabled = false;
  btn.innerHTML = `<span>Lås opp &rarr;</span>`;
}

// 5. Unlock Gallery & Fetch Photos
// Passordsperren (forsinkelse ved gale forsøk) styres av serveren. Siden viser bare serverens melding.
async function unlockGallery(galleryId, password) {
  const errBox = document.getElementById('modal-error');
  const showError = (msg) => {
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
  };

  // Demomodus (?demo=1): ingen kontakt med backenden
  if (DEMO) {
    const pwd = (password || '').trim().toLowerCase();
    const g = allGalleries.find(x => x.id === galleryId);
    if (g && g.locked && pwd !== 'ranheim' && pwd !== '1234') {
      showError('Feil passord! (Tips i demomodus: skriv "ranheim")');
      return;
    }
    closePasswordModal();
    displayGallery({
      id: g ? g.id : galleryId,
      title: g ? g.title : 'Galleri',
      date: g ? g.date : '',
      description: g ? g.description : '',
      folderUrl: 'https://drive.google.com/drive/folders/DEMO_FOLDER_ID',
      images: getDemoPhotos(galleryId)
    });
    return;
  }

  // Ekte Google Apps Script-backend
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'open', id: galleryId, password: password })
    });
    const data = await res.json();

    if (data.ok && data.gallery) {
      closePasswordModal();
      const transformed = {
        ...data.gallery,
        images: data.gallery.images.map(img => ({
          id: img.id,
          name: img.name,
          thumbUrl: `https://drive.google.com/thumbnail?id=${img.id}&sz=w800`,
          fullUrl: `https://drive.google.com/thumbnail?id=${img.id}&sz=w2048`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${img.id}`
        }))
      };
      displayGallery(transformed);
    } else {
      showError(data.error || 'Kunne ikke åpne galleriet. Prøv igjen.');
    }
  } catch (err) {
    showError('Klarte ikke kontakte serveren. Prøv igjen.');
  }
}

// 6. Display Gallery Images Grid
function displayGallery(galleryData) {
  currentGallery = galleryData;
  currentPhotos = galleryData.images || [];

  document.getElementById('view-list').classList.add('hidden');
  document.getElementById('view-gallery').classList.remove('hidden');

  document.getElementById('gallery-active-title').textContent = galleryData.title;
  document.getElementById('gallery-active-date').textContent = galleryData.date || '';
  document.getElementById('gallery-active-count').textContent = `${currentPhotos.length} bilder`;
  document.getElementById('gallery-active-desc').textContent = galleryData.description || '';

  // Set Download All Button link
  const downloadBtn = document.getElementById('btn-download-all');
  downloadBtn.href = galleryData.folderUrl || '#';
  const downloadText = document.getElementById('btn-download-all-text');
  if (downloadText) {
    downloadText.textContent = `Last ned alle ${currentPhotos.length} bildene (.zip)`;
  }

  // Render Photo Grid
  const grid = document.getElementById('photos-grid');
  grid.innerHTML = '';

  if (currentPhotos.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-zinc-400 font-mono text-xs">
        Ingen bilder funnet i denne mappen ennå.
      </div>
    `;
    return;
  }

  currentPhotos.forEach((photo, idx) => {
    const item = document.createElement('div');
    item.className = 'group relative aspect-square rounded-xl overflow-hidden bg-black border border-white/10 hover:border-white/40 focus-visible:border-white transition cursor-pointer';
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Vis ${photo.name || 'bilde'} i stor visning`);
    item.onclick = () => openLightbox(idx);
    item.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    };

    item.innerHTML = `
      <img src="${escapeHtml(photo.thumbUrl)}" alt="${escapeHtml(photo.name)}" loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
        <span class="text-[11px] font-mono text-white truncate">${escapeHtml(photo.name)}</span>
        <span class="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
          <span>Se forstørret</span> &rarr;
        </span>
      </div>
    `;

    const thumb = item.querySelector('img');
    if (thumb) thumb.addEventListener('error', () => { thumb.style.opacity = '0.2'; });

    grid.appendChild(item);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToList() {
  document.getElementById('view-gallery').classList.add('hidden');
  document.getElementById('view-list').classList.remove('hidden');
  currentGallery = null;
  currentPhotos = [];
}

// 7. Lightbox Fullscreen Modal Functions
function openLightbox(index) {
  currentPhotoIndex = index;
  updateLightboxImage();
  rememberFocus();
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('lb-close').focus();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb.classList.contains('hidden')) return;
  lb.classList.add('hidden');
  document.body.style.overflow = '';
  restoreFocus();
}

function updateLightboxImage() {
  if (!currentPhotos || currentPhotos.length === 0) return;
  const photo = currentPhotos[currentPhotoIndex];
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  const filename = document.getElementById('lb-filename');
  const dlBtn = document.getElementById('lb-download-single');

  img.style.opacity = '0.5';
  img.src = photo.fullUrl || photo.thumbUrl;
  img.onload = () => { img.style.opacity = '1'; };

  counter.textContent = `${currentPhotoIndex + 1} / ${currentPhotos.length}`;
  filename.textContent = photo.name;
  dlBtn.href = photo.downloadUrl || photo.fullUrl;
}

function nextPhoto(e) {
  if (e) e.stopPropagation();
  if (currentPhotoIndex < currentPhotos.length - 1) {
    currentPhotoIndex++;
  } else {
    currentPhotoIndex = 0;
  }
  updateLightboxImage();
}

function prevPhoto(e) {
  if (e) e.stopPropagation();
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
  } else {
    currentPhotoIndex = currentPhotos.length - 1;
  }
  updateLightboxImage();
}

function onLightboxBgClick(e) {
  if (e.target.id === 'lb-img' || e.target.closest('button')) return;
  closeLightbox();
}

// Keyboard navigation
window.addEventListener('keydown', (e) => {
  const pwdModal = document.getElementById('modal-password');
  if (!pwdModal.classList.contains('hidden')) {
    if (e.key === 'Escape') closePasswordModal();
    trapFocus(e, pwdModal);
    return;
  }

  const lb = document.getElementById('lightbox');
  if (lb.classList.contains('hidden')) return;
  trapFocus(e, lb);

  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft') prevPhoto();
});

// Touch Swipe Support for Lightbox on Mobile
let touchStartX = 0;
let touchEndX = 0;
const lbArea = document.getElementById('lightbox');
lbArea.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
lbArea.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const diff = touchEndX - touchStartX;
  if (Math.abs(diff) > 40) {
    if (diff < 0) nextPhoto();
    else prevPhoto();
  }
}

// Knapper (ingen inline-handlere, så en streng CSP er mulig)
const ACTIONS = {
  'refresh': () => loadGalleries(),
  'back': () => backToList(),
  'close-password': () => closePasswordModal(),
  'toggle-password': () => togglePasswordVisibility(),
  'close-lightbox': () => closeLightbox(),
  'prev': (e) => prevPhoto(e),
  'next': (e) => nextPhoto(e),
  'lightbox-bg': (e) => onLightboxBgClick(e)
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](e);
});
document.getElementById('form-password').addEventListener('submit', submitPassword);

// Initialize
loadGalleries();
