/**
 * storage.js - Håndtering av automatisk lagring i localStorage, JSON fil-eksport/import, og angre-historikk (Undo)
 * For Quiz Kraft (ranheimkraft.no)
 */

const STORAGE_KEY = 'quiz_kraft_state_v1';
const MAX_UNDO_STACK = 40;

const undoStack = [];
let statusChangeCallback = null;

/**
 * Oppretter et standard tomt quiz-oppsett med 5 lag og 5 runder.
 */
function createDefaultState() {
  const today = new Date().toISOString().split('T')[0];
  const roundCount = 5;
  const roundNames = [];
  for (let i = 1; i <= roundCount; i++) {
    roundNames.push(`Runde ${i}`);
  }

  const teams = [];
  for (let t = 1; t <= 5; t++) {
    teams.push({
      id: `team_${Date.now()}_${t}`,
      name: `Lag ${t}`,
      scores: Array(roundCount).fill(''),
      rank: t,
      tieBreakerNote: ''
    });
  }

  return {
    version: 1,
    title: 'Ranheim Quiz',
    date: today,
    roundCount: roundCount,
    roundNames: roundNames,
    teams: teams,
    isSorted: false,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Henter lagret tilstand fra localStorage eller oppretter standard.
 */
function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.teams) && typeof data.roundCount === 'number') {
        return normalizeState(data);
      }
    }
  } catch (err) {
    console.warn('Kunne ikke lese fra localStorage:', err);
  }
  return createDefaultState();
}

/**
 * Normaliserer data slik at alle felt eksisterer uansett eldre formater.
 */
function normalizeState(data) {
  const roundCount = Math.max(1, parseInt(data.roundCount, 10) || 5);
  const roundNames = Array.isArray(data.roundNames) ? data.roundNames : [];
  while (roundNames.length < roundCount) {
    roundNames.push(`Runde ${roundNames.length + 1}`);
  }

  const teams = Array.isArray(data.teams) ? data.teams.map((t, idx) => {
    const scores = Array.isArray(t.scores) ? [...t.scores] : [];
    while (scores.length < roundCount) {
      scores.push('');
    }
    return {
      id: t.id || `team_${Date.now()}_${idx + 1}`,
      name: (t.name !== undefined && t.name !== null) ? String(t.name) : `Lag ${idx + 1}`,
      scores: scores.slice(0, roundCount),
      rank: t.rank || (idx + 1),
      tieBreakerNote: t.tieBreakerNote || ''
    };
  }) : [];

  return {
    version: 1,
    title: data.title || 'Ranheim Quiz',
    date: data.date || new Date().toISOString().split('T')[0],
    roundCount: roundCount,
    roundNames: roundNames.slice(0, roundCount),
    teams: teams,
    isSorted: Boolean(data.isSorted),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Lagrer tilstand til localStorage og oppdaterer tidsstempel.
 */
function saveStateToStorage(state, skipUndo = false) {
  if (!state) return;
  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notifyStatus(state.updatedAt);
  } catch (err) {
    console.error('Kunne ikke lagre til localStorage:', err);
  }
}

/**
 * Dytter en kopi av gjeldende tilstand til angre-stakken (Undo stack).
 */
function pushUndoState(state) {
  if (!state) return;
  try {
    const snapshot = JSON.parse(JSON.stringify(state));
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO_STACK) {
      undoStack.shift();
    }
    updateUndoButtonUI();
  } catch (err) {
    console.warn('Feil ved push til undo-stakk:', err);
  }
}

/**
 * Utfører angring (Undo).
 * Returnerer den forrige tilstanden hvis tilgjengelig, ellers null.
 */
function popUndoState() {
  if (undoStack.length === 0) return null;
  const previousState = undoStack.pop();
  updateUndoButtonUI();
  return previousState;
}

function hasUndoState() {
  return undoStack.length > 0;
}

function updateUndoButtonUI() {
  const btn = document.getElementById('btn-undo');
  if (btn) {
    btn.disabled = undoStack.length === 0;
    if (undoStack.length > 0) {
      btn.title = `Angre siste endring (${undoStack.length} steg i minnet)`;
    } else {
      btn.title = 'Ingenting å angre';
    }
  }
}

/**
 * Registrerer en lytter for statusoppdateringer (f.eks. "Lagret kl. 19:42").
 */
function onStatusChange(callback) {
  statusChangeCallback = callback;
}

function notifyStatus(isoTimestamp) {
  if (typeof statusChangeCallback === 'function') {
    statusChangeCallback(isoTimestamp);
  }
}

/**
 * Laster ned hele quizen som en .json-fil til datamaskinen.
 */
function exportQuizToJson(state) {
  if (!state) return;
  const dateStr = state.date || new Date().toISOString().split('T')[0];
  const safeTitle = (state.title || 'Quiz').replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_');
  const filename = `${safeTitle}_${dateStr}.json`;

  const jsonString = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Leser en .json-fil fra filvelger og returnerer et gyldig state-objekt via Promise.
 */
function importQuizFromJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Ingen fil valgt'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || !Array.isArray(parsed.teams)) {
          return reject(new Error('Ugyldig filformat. Filen mangler nødvendige quiz-data.'));
        }
        const state = normalizeState(parsed);
        resolve(state);
      } catch (err) {
        reject(new Error('Kunne ikke lese filen. Sjekk at det er en gyldig .json-fil.'));
      }
    };
    reader.onerror = () => reject(new Error('Feil ved lesing av fil fra disk.'));
    reader.readAsText(file);
  });
}

window.QuizStorage = {
  createDefaultState,
  loadStateFromStorage,
  saveStateToStorage,
  pushUndoState,
  popUndoState,
  hasUndoState,
  updateUndoButtonUI,
  onStatusChange,
  exportQuizToJson,
  importQuizFromJson,
  normalizeState
};
