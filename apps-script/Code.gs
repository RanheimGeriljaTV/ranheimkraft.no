/**
 * Ranheim Kraft – Galleri-backend (Google Apps Script)
 * ----------------------------------------------------
 * Lim inn denne filen i: Google Apps Script.
 *
 * Backend API for gallerioversikt og sikker autentisering.
 *
 * - Autentisering håndteres sikkert på serversiden.
 * - Tomt passord = åpent galleri (ingen passord kreves).
 * - Aktiv = "nei" skjuler galleriet uten å slette raden.
 * - Nye bilder i Disk-mappen dukker opp automatisk (hurtigbuffer: 5 min).
 */

const SHEET_NAME = 'Gallerier';
const HEADERS = ['ID', 'Tittel', 'Dato', 'Beskrivelse', 'Mappe-lenke', 'Passord', 'Aktiv'];
const CACHE_SECONDS = 300;   // hvor lenge bildelister mellomlagres
const MAX_FAILS = 8;         // feil passord-forsøk per galleri før midlertidig sperre
const LOCK_SECONDS = 600;    // sperretid (10 min) etter for mange feil

/* ---------- Administrasjon & Konfigurasjon ---------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🖼️ Galleri')
    .addItem('1. Opprett oppsett', 'setup')
    .addItem('2. Del mappene med lenke (kreves for visning)', 'shareFolders')
    .addSeparator()
    .addItem('Tøm hurtigbuffer (vis nye bilder med en gang)', 'clearCache')
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.appendRow([
      'eksempel-galleri',
      'Eksempelgalleri',
      new Date(),
      'Bytt ut denne raden med ditt første galleri',
      'https://drive.google.com/drive/folders/LIM_INN_MAPPE_ID',
      'byttMeg123',
      'ja'
    ]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1e3378').setFontColor('#ffffff');
    sh.getRange('C:C').setNumberFormat('yyyy-mm-dd');
    sh.autoResizeColumns(1, HEADERS.length);
  }
  notify_('Oppsett klart! Fyll inn én rad per galleri i fanen "' + SHEET_NAME + '".');
}

/** Setter hver galleri-mappe til "Alle med lenken kan se" slik at bildene kan vises på nettsiden. */
function shareFolders() {
  const report = [];
  readGalleries_(true).forEach(function (g) {
    try {
      DriveApp.getFolderById(g.folderId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      report.push('✅ ' + g.title);
    } catch (e) {
      report.push('❌ ' + g.title + ' – ' + e.message);
    }
  });
  notify_(report.length ? report.join('\n') : 'Fant ingen gallerier med gyldig mappe-lenke.');
}

function clearCache() {
  const keys = [];
  readGalleries_(true).forEach(function (g) { keys.push('img_' + g.folderId, 'fail_' + g.id); });
  if (keys.length) CacheService.getScriptCache().removeAll(keys);
  notify_('Hurtigbuffer tømt.');
}

/* ---------- Web-API (brukes av galleri.html) ---------- */

/** GET → offentlig liste over gallerier (kun titler, ingen mappe-ID-er eller passord). */
function doGet() {
  return json_(list_());
}

/** POST (text/plain JSON) → { action: 'open', id, password } */
function doPost(e) {
  let req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (req.action === 'open') return json_(open_(req.id, req.password));
  return json_(list_());
}

function list_() {
  const galleries = readGalleries_(false).map(function (g) {
    let count = null;
    try { count = images_(g.folderId).length; } catch (e) {}
    return { id: g.id, title: g.title, date: g.date, description: g.description, locked: !!g.password, count: count };
  });
  return { ok: true, galleries: galleries };
}

function open_(id, password) {
  const g = readGalleries_(false).filter(function (x) { return x.id === String(id || ''); })[0];
  if (!g) return { ok: false, error: 'Fant ikke galleriet.' };

  const cache = CacheService.getScriptCache();
  const failKey = 'fail_' + g.id;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_FAILS) {
    return { ok: false, error: 'For mange feil forsøk. Prøv igjen om 10 minutter.' };
  }

  if (g.password && String(password || '').trim() !== g.password) {
    cache.put(failKey, String(fails + 1), LOCK_SECONDS);
    Utilities.sleep(800); // gjør gjetting tregt
    return { ok: false, error: 'Feil passord.' };
  }

  let images;
  try {
    images = images_(g.folderId);
  } catch (e) {
    return { ok: false, error: 'Fikk ikke tilgang til Disk-mappen. Sjekk mappe-lenken.' };
  }

  return {
    ok: true,
    gallery: {
      id: g.id,
      title: g.title,
      date: g.date,
      description: g.description,
      folderUrl: 'https://drive.google.com/drive/folders/' + g.folderId,
      images: images
    }
  };
}

/* ---------- Hjelpefunksjoner ---------- */

function sheet_() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) {
    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (sheetId) ss = SpreadsheetApp.openById(sheetId);
  }
  return ss ? ss.getSheetByName(SHEET_NAME) : null;
}

function readGalleries_(includeInactive) {
  const sh = sheet_();
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = sh.getDataRange().getValues();
  const head = rows.shift().map(function (h) { return String(h).trim().toLowerCase(); });
  const c = {};
  HEADERS.forEach(function (h) { c[h] = head.indexOf(h.toLowerCase()); });
  const val = function (r, h) { return c[h] >= 0 ? r[c[h]] : ''; };

  return rows.map(function (r) {
    const title = String(val(r, 'Tittel')).trim();
    return {
      id: slug_(String(val(r, 'ID')).trim() || title),
      title: title,
      date: fmtDate_(val(r, 'Dato')),
      description: String(val(r, 'Beskrivelse')).trim(),
      folderId: folderId_(String(val(r, 'Mappe-lenke')).trim()),
      password: String(val(r, 'Passord')).trim(),
      active: !/^(nei|no|false|0|av)$/i.test(String(val(r, 'Aktiv')).trim())
    };
  }).filter(function (g) {
    return g.title && g.folderId && (includeInactive || g.active);
  });
}

function images_(folderId) {
  const cache = CacheService.getScriptCache();
  const key = 'img_' + folderId;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const out = [];
  const it = DriveApp.getFolderById(folderId).getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (String(f.getMimeType()).indexOf('image/') === 0) out.push({ id: f.getId(), name: f.getName() });
  }
  out.sort(function (a, b) { return a.name.localeCompare(b.name, 'nb', { numeric: true }); });
  try { cache.put(key, JSON.stringify(out), CACHE_SECONDS); } catch (e) { /* for stor liste for cache – helt ok */ }
  return out;
}

function folderId_(link) {
  if (!link || link.indexOf('LIM_INN') >= 0) return '';
  const m = link.match(/folders\/([\w-]{10,})/) || link.match(/[?&]id=([\w-]{10,})/);
  if (m) return m[1];
  return /^[\w-]{10,}$/.test(link) ? link : '';
}

function slug_(s) {
  return String(s).toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function fmtDate_(d) {
  if (d instanceof Date && !isNaN(d)) return Utilities.formatDate(d, 'Europe/Oslo', 'yyyy-MM-dd');
  return String(d || '').trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function notify_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}
