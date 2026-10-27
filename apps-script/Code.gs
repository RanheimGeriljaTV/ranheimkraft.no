/**
 * Ranheim Kraft – Galleri-backend (Google Apps Script)
 * ----------------------------------------------------
 * Lim inn denne filen i Google Apps Script tilknyttet ditt regneark.
 *
 * Backend API for gallerioversikt og sikker autentisering:
 * - Sikkerhet (Forslag A): Saltet SHA-256 kryptografisk hashing av passord.
 * - Sikkerhet (Forslag B): Brute-Force beskyttelse & midlertidig 15-minutters sperre ved 5 feil forsøk.
 * - Tomt passord i arket = Åpent galleri (ingen passord kreves).
 * - Aktiv = "nei" skjuler galleriet uten å slette raden.
 * - Nye bilder i Disk-mappen dukker opp automatisk (hurtigbuffer: 5 min).
 */

const SHEET_NAME = 'Gallerier';
const HEADERS = ['ID', 'Tittel', 'Dato', 'Beskrivelse', 'Mappe-lenke', 'Passord', 'Aktiv'];
const CACHE_SECONDS = 300;     // Hvor lenge bildelister mellomlagres (5 min)
const MAX_FAILS = 5;           // Maks feil passordforsøk før midlertidig lås
const LOCK_SECONDS = 900;      // Sperretid: 15 minutter (900 sekunder)

/* ---------- Administrasjon & Konfigurasjon ---------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🖼️ Galleri')
    .addItem('1. Opprett oppsett', 'setup')
    .addItem('2. Del mappene med lenke (kreves for visning)', 'shareFolders')
    .addSeparator()
    .addItem('🔒 Sikre passord (Konverter klartekst til SHA-256 hash)', 'hashAllPlaintextPasswords')
    .addSeparator()
    .addItem('Tøm hurtigbuffer og låser (vis nye bilder / lås opp)', 'clearCache')
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
      formatHashedPassword_('byttMeg123'),
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

/** Konverterer alle råtekstpassord i arket til irreversible saltet SHA-256 hasher */
function hashAllPlaintextPasswords() {
  const sh = sheet_();
  if (!sh || sh.getLastRow() < 2) {
    notify_('Ingen gallerier funnet.');
    return;
  }
  const data = sh.getDataRange().getValues();
  const headers = data[0].map(function (h) { return String(h).trim().toLowerCase(); });
  const passCol = headers.indexOf('passord');
  if (passCol < 0) {
    notify_('Fant ikke kolonnen "Passord".');
    return;
  }

  let count = 0;
  for (let r = 1; r < data.length; r++) {
    const current = String(data[r][passCol] || '').trim();
    if (current && current.indexOf('sha256:') !== 0) {
      const hashed = formatHashedPassword_(current);
      sh.getRange(r + 1, passCol + 1).setValue(hashed);
      count++;
    }
  }

  notify_(count > 0 
    ? '✅ ' + count + ' passord ble kryptert og erstattet med sikre SHA-256 salter og hasher!' 
    : 'Alle eksisterende passord i arket er allerede sikret med SHA-256 hash.');
}

/** Tømmer hurtigbuffer for bilder og nullstiller midlertidige passordsperrer */
function clearCache() {
  const keys = [];
  readGalleries_(true).forEach(function (g) {
    keys.push('img_' + g.folderId, 'fail_gal_' + g.id);
  });
  if (keys.length) CacheService.getScriptCache().removeAll(keys);
  notify_('Hurtigbuffer og eventuelle passordsperrer er tømt.');
}

/* ---------- Web-API (brukes av galleri.html) ---------- */

/** GET → offentlig liste over gallerier (kun titler og metadata, ALDRI passord eller interne ID-er). */
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
    return { 
      id: g.id, 
      title: g.title, 
      date: g.date, 
      description: g.description, 
      locked: !!g.password, 
      count: count 
    };
  });
  return { ok: true, galleries: galleries };
}

function open_(id, password) {
  const g = readGalleries_(false).filter(function (x) { return x.id === String(id || ''); })[0];
  if (!g) return { ok: false, error: 'Fant ikke galleriet.' };

  const cache = CacheService.getScriptCache();
  const failKey = 'fail_gal_' + g.id;
  const fails = Number(cache.get(failKey) || 0);

  // Forslag B: Brute-Force lockout etter 5 feil forsøk (15 minutters sperre)
  if (fails >= MAX_FAILS) {
    return { 
      ok: false, 
      status: 429,
      error: 'For mange feil passordforsøk. Galleriet er midlertidig låst i 15 minutter av sikkerhetshensyn.' 
    };
  }

  // Forslag A: Validering via saltet SHA-256 hash
  const isValid = verifyPassword_(password, g.password);

  if (!isValid) {
    const newFails = fails + 1;
    cache.put(failKey, String(newFails), LOCK_SECONDS);
    Utilities.sleep(1000); // 1 sekund forsinkelse for å sinke automatiske roboter
    const remaining = MAX_FAILS - newFails;
    const msg = remaining > 0
      ? 'Feil passord. (' + remaining + ' forsøk gjenstår før 15 min sperre)'
      : 'Feil passord. Galleriet er nå låst i 15 minutter.';
    return { ok: false, error: msg };
  }

  // Riktig passord: Fjern eventuell feil-teller
  if (fails > 0) {
    cache.remove(failKey);
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

/* ---------- Kryptografi & Sikkerhet (Forslag A) ---------- */

/** Henter eller genererer en permanent hemmelig systemnøkkel (pepper) */
function getSystemSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('PEPPER');
  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('PEPPER', secret);
  }
  return secret;
}

/** Genererer et tilfeldig 8-tegns salt */
function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 8);
}

/** Beregner SHA-256 hash av passord + salt + systempepper */
function hashPassword_(password, salt) {
  const raw = String(password || '').trim() + ':' + String(salt || '') + ':' + getSystemSecret_();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/** Formaterer til lagringsstreng: sha256:SALT:HASH */
function formatHashedPassword_(password) {
  if (!password || !String(password).trim()) return '';
  const salt = generateSalt_();
  const hash = hashPassword_(password, salt);
  return 'sha256:' + salt + ':' + hash;
}

/** Sammenligner to strenger i konstant tid mot timing-angrep */
function timingSafeEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Validerer innkommende passord mot lagret verdi (støtter sha256:salt:hash og bakoverkompatibel råtekst) */
function verifyPassword_(inputPassword, storedVal) {
  if (!storedVal) return true; // intet passord satt = åpent galleri
  const input = String(inputPassword || '').trim();
  if (!input) return false;

  const stored = String(storedVal).trim();

  // Format: sha256:salt:hash
  if (stored.indexOf('sha256:') === 0) {
    const parts = stored.split(':');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      const actualHash = hashPassword_(input, salt);
      return timingSafeEqual_(actualHash, expectedHash);
    }
  }

  // Bakoverkompatibilitet: Råtekst (hvis noen nettopp har skrevet et ord rett i arket)
  return timingSafeEqual_(input, stored);
}

/* ---------- Databasetilgang & Hjelpefunksjoner ---------- */

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
  try { cache.put(key, JSON.stringify(out), CACHE_SECONDS); } catch (e) { /* for stor liste for cache */ }
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
