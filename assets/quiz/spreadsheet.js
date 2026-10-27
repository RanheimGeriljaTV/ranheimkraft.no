/**
 * spreadsheet.js - Regneark-tabell, dynamisk rendering, tastaturnavigasjon og redigering
 * For Quiz Kraft (ranheimkraft.no)
 */

let appState = null;
let onStateChangeCallback = null;

function initSpreadsheet(state, onStateChange) {
  appState = state;
  onStateChangeCallback = onStateChange;
  renderTable();
}

function updateState(newState) {
  appState = newState;
  renderTable();
}

function getState() {
  return appState;
}

/**
 * Hovedfunksjon for rendering av regneark-tabellen
 */
function renderTable() {
  const container = document.getElementById('spreadsheet-container');
  if (!container || !appState) return;

  const roundCount = appState.roundCount || 5;
  const roundNames = appState.roundNames || [];
  const teams = appState.teams || [];

  let html = `
    <table class="quiz-table" id="quiz-table" role="grid" aria-label="Quiz Poengtavle">
      <thead>
        <tr>
          <th class="col-rank" scope="col">#</th>
          <th class="col-team" scope="col">Lagnavn</th>
  `;

  // Runde-kolonner
  for (let r = 0; r < roundCount; r++) {
    const roundTitle = roundNames[r] || `Runde ${r + 1}`;
    html += `
      <th class="col-round" scope="col">
        <div class="th-round-header">
          <input type="text" class="round-title-input" data-round-idx="${r}" value="${escapeHtml(roundTitle)}" aria-label="Endre navn på runde ${r + 1}" title="Klikk for å endre tittel på runden" />
          ${roundCount > 1 ? `<button type="button" class="btn-remove-round" data-round-idx="${r}" title="Fjern runde ${r + 1}" aria-label="Fjern runde ${r + 1}">×</button>` : ''}
        </div>
      </th>
    `;
  }

  // Sammenlagt og Merknad
  html += `
          <th class="col-total" scope="col">SAMMENLAGT</th>
          <th class="col-note" scope="col">Merknad / Tie-breaker</th>
          <th class="col-actions no-print" scope="col">Fjern</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (teams.length === 0) {
    html += `
      <tr>
        <td colspan="${roundCount + 4}" class="empty-table-msg">
          Ingen lag er registrert ennå. Trykk på den store grønne knappen <strong>"Legg til nytt lag"</strong> for å starte!
        </td>
      </tr>
    `;
  } else {
    teams.forEach((team, tIdx) => {
      const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
      const rank = team.rank || (tIdx + 1);
      
      let rankBadge = `${rank}.`;
      let rowHighlightClass = '';
      if (appState.isSorted) {
        if (rank === 1) {
          rankBadge = `🥇 1.`;
          rowHighlightClass = 'row-gold';
        } else if (rank === 2) {
          rankBadge = `🥈 2.`;
          rowHighlightClass = 'row-silver';
        } else if (rank === 3) {
          rankBadge = `🥉 3.`;
          rowHighlightClass = 'row-bronze';
        }
      }

      html += `
        <tr class="team-row ${rowHighlightClass}" data-team-idx="${tIdx}">
          <td class="col-rank">
            <span class="rank-badge" title="Plassering: ${rank}.">${rankBadge}</span>
          </td>
          <td class="col-team">
            <input type="text" 
                   class="team-name-input" 
                   data-team-idx="${tIdx}" 
                   value="${escapeHtml(team.name || '')}" 
                   placeholder="Skriv lagnavn..." 
                   aria-label="Lagnavn for lag ${tIdx + 1}" />
          </td>
      `;

      // Poengceller
      for (let r = 0; r < roundCount; r++) {
        const rawScore = team.scores ? team.scores[r] : '';
        html += `
          <td class="col-round">
            <input type="text" 
                   inputmode="decimal"
                   class="score-input" 
                   data-team-idx="${tIdx}" 
                   data-round-idx="${r}" 
                   value="${escapeHtml(rawScore)}" 
                   placeholder="-" 
                   aria-label="Poeng for ${escapeHtml(team.name || 'Lag ' + (tIdx + 1))}, runde ${r + 1}" />
          </td>
        `;
      }

      // Sammenlagtcelle
      html += `
          <td class="col-total">
            <span class="total-display" id="total-${tIdx}" aria-live="polite">${window.QuizScoring ? window.QuizScoring.formatScore(total) : total}</span>
          </td>
          <td class="col-note">
            ${team.tieBreakerNote ? `<span class="tie-breaker-badge">${escapeHtml(team.tieBreakerNote)}</span>` : '<span class="note-empty">-</span>'}
          </td>
          <td class="col-actions no-print">
            <button type="button" class="btn-delete-team" data-team-idx="${tIdx}" title="Slett dette laget" aria-label="Slett ${escapeHtml(team.name || 'lag')}">Slett</button>
          </td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
      <tfoot>
        <tr class="summary-row">
          <td class="col-rank">Totalt</td>
          <td class="col-team"><strong>${teams.length} lag</strong></td>
  `;

  // Gjennomsnitt per runde
  for (let r = 0; r < roundCount; r++) {
    let rSum = 0;
    let rCount = 0;
    teams.forEach(t => {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      if (parsed !== null) {
        rSum += parsed;
        rCount++;
      }
    });
    const avg = rCount > 0 ? (rSum / rCount) : null;
    html += `
      <td class="col-round summary-cell" title="Gjennomsnitt for runde ${r + 1}: ${avg !== null ? window.QuizScoring.formatScore(avg) : 'Ingen poeng'}">
        <span class="avg-label">Snitt:</span>
        <span class="avg-value">${avg !== null ? window.QuizScoring.formatScore(avg) : '-'}</span>
      </td>
    `;
  }

  // Sammenlagt snitt
  let grandTotal = 0;
  teams.forEach(t => {
    grandTotal += window.QuizScoring ? window.QuizScoring.calculateTeamTotal(t, roundCount) : 0;
  });
  const teamAvg = teams.length > 0 ? (grandTotal / teams.length) : null;

  html += `
          <td class="col-total summary-cell">
            <span class="avg-label">Snitt totalt:</span>
            <span class="avg-value">${teamAvg !== null ? window.QuizScoring.formatScore(teamAvg) : '-'}</span>
          </td>
          <td class="col-note summary-cell"></td>
          <td class="col-actions no-print"></td>
        </tr>
      </tfoot>
    </table>
  `;

  container.innerHTML = html;
  bindTableEvents(container);
}

/**
 * Knytter opp hendelser for inntasting, tastaturnavigasjon og sletting
 */
function bindTableEvents(container) {
  // 1. Tastatur- og inntastingshåndtering for poengfelter
  const scoreInputs = container.querySelectorAll('.score-input');
  scoreInputs.forEach(input => {
    // Sanntidsoppdatering av sum ved hvert tastetrykk
    input.addEventListener('input', (e) => {
      const tIdx = parseInt(e.target.dataset.teamIdx, 10);
      const rIdx = parseInt(e.target.dataset.roundIdx, 10);
      const val = e.target.value;

      appState.teams[tIdx].scores[rIdx] = val;
      // Hvis vi endrer poeng, er tabellen ikke lenger garantert ferdig sortert
      appState.isSorted = false;
      appState.teams.forEach(t => t.tieBreakerNote = '');

      // Oppdater direkte sum-visning i samme rad
      const totalSpan = document.getElementById(`total-${tIdx}`);
      if (totalSpan && window.QuizScoring) {
        const newTotal = window.QuizScoring.calculateTeamTotal(appState.teams[tIdx], appState.roundCount);
        totalSpan.textContent = window.QuizScoring.formatScore(newTotal);
      }

      notifyChange(false);
    });

    // Formatering med komma ved blur (når man forlater feltet)
    input.addEventListener('blur', (e) => {
      const tIdx = parseInt(e.target.dataset.teamIdx, 10);
      const rIdx = parseInt(e.target.dataset.roundIdx, 10);
      const rawVal = e.target.value.trim();

      if (rawVal === '') {
        e.target.value = '';
        appState.teams[tIdx].scores[rIdx] = '';
      } else if (window.QuizScoring) {
        const parsed = window.QuizScoring.parseScore(rawVal);
        if (parsed !== null) {
          const formatted = window.QuizScoring.formatScore(parsed);
          e.target.value = formatted;
          appState.teams[tIdx].scores[rIdx] = formatted;
        }
      }
      notifyChange(true);
    });

    // TASTATURNAVIGASJON (Ekstremt viktig krav for quizmaster og projektorbruk!)
    input.addEventListener('keydown', (e) => {
      handleScoreKeydown(e, input);
    });
  });

  // 2. Lagnavn-endring
  const teamNameInputs = container.querySelectorAll('.team-name-input');
  teamNameInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const tIdx = parseInt(e.target.dataset.teamIdx, 10);
      appState.teams[tIdx].name = e.target.value;
      notifyChange(false);
    });

    input.addEventListener('keydown', (e) => {
      const tIdx = parseInt(input.dataset.teamIdx, 10);
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusCell(tIdx + 1, 'name');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusCell(tIdx - 1, 'name');
      } else if (e.key === 'ArrowRight' && (input.selectionStart === input.value.length || e.key === 'Enter')) {
        // Hopp til første runde
        e.preventDefault();
        focusCell(tIdx, 0);
      }
    });

    input.addEventListener('blur', () => {
      notifyChange(true);
    });
  });

  // 3. Rundenavn-endring
  const roundInputs = container.querySelectorAll('.round-title-input');
  roundInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const rIdx = parseInt(e.target.dataset.roundIdx, 10);
      appState.roundNames[rIdx] = e.target.value.trim() || `Runde ${rIdx + 1}`;
      notifyChange(true);
    });
  });

  // 4. Slett lag
  const deleteButtons = container.querySelectorAll('.btn-delete-team');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tIdx = parseInt(btn.dataset.teamIdx, 10);
      deleteTeam(tIdx);
    });
  });

  // 5. Fjern runde
  const removeRoundButtons = container.querySelectorAll('.btn-remove-round');
  removeRoundButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const rIdx = parseInt(btn.dataset.roundIdx, 10);
      deleteRound(rIdx);
    });
  });
}

/**
 * Tastaturnavigasjon for poengceller:
 * - Enter eller Pil Ned: Hopper rett NED til neste lag i samme runde.
 * - Pil Opp: Hopper rett OPP til forrige lag i samme runde.
 * - Pil Høyre / Venstre: Navigerer horisontalt mellom runder.
 */
function handleScoreKeydown(e, currentInput) {
  const tIdx = parseInt(currentInput.dataset.teamIdx, 10);
  const rIdx = parseInt(currentInput.dataset.roundIdx, 10);
  const teamCount = appState.teams.length;
  const roundCount = appState.roundCount;

  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (tIdx + 1 < teamCount) {
      // Gå til neste lag i samme runde
      focusCell(tIdx + 1, rIdx);
    } else {
      // På siste lag: loop til toppen av neste runde hvis neste runde finnes
      if (rIdx + 1 < roundCount) {
        focusCell(0, rIdx + 1);
      } else {
        // Hvis på aller siste celle, bli værende eller behold fokus
        currentInput.select();
      }
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (tIdx - 1 >= 0) {
      focusCell(tIdx - 1, rIdx);
    } else if (rIdx - 1 >= 0) {
      // Loop opp til bunnen av forrige runde
      focusCell(teamCount - 1, rIdx - 1);
    }
  } else if (e.key === 'ArrowRight') {
    // Hvis markøren er helt til høyre i feltet, hopp til neste runde
    if (currentInput.selectionStart === currentInput.value.length) {
      if (rIdx + 1 < roundCount) {
        e.preventDefault();
        focusCell(tIdx, rIdx + 1);
      }
    }
  } else if (e.key === 'ArrowLeft') {
    // Hvis markøren er helt til venstre i feltet, hopp til forrige runde eller lagnavn
    if (currentInput.selectionStart === 0 && currentInput.selectionEnd === 0) {
      e.preventDefault();
      if (rIdx - 1 >= 0) {
        focusCell(tIdx, rIdx - 1);
      } else {
        focusCell(tIdx, 'name');
      }
    }
  }
}

/**
 * Setter fokus på spesifikk celle i tabellen
 */
function focusCell(teamIdx, target) {
  if (teamIdx < 0 || teamIdx >= appState.teams.length) return;

  if (target === 'name') {
    const nameInput = document.querySelector(`.team-name-input[data-team-idx="${teamIdx}"]`);
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  } else if (typeof target === 'number') {
    const scoreInput = document.querySelector(`.score-input[data-team-idx="${teamIdx}"][data-round-idx="${target}"]`);
    if (scoreInput) {
      scoreInput.focus();
      scoreInput.select();
    }
  }
}

/**
 * Handlinger: Legg til lag
 */
function addTeam() {
  if (!appState) return;
  saveUndoSnapshot();

  const newIndex = appState.teams.length + 1;
  const newTeam = {
    id: `team_${Date.now()}_${newIndex}`,
    name: `Lag ${newIndex}`,
    scores: Array(appState.roundCount).fill(''),
    rank: newIndex,
    tieBreakerNote: ''
  };

  appState.teams.push(newTeam);
  appState.isSorted = false;
  renderTable();
  notifyChange(true);

  // Sett fokus direkte på det nye lagets navn
  setTimeout(() => {
    focusCell(appState.teams.length - 1, 'name');
  }, 50);
}

/**
 * Handlinger: Slett lag
 */
function deleteTeam(tIdx) {
  if (!appState || tIdx < 0 || tIdx >= appState.teams.length) return;
  const team = appState.teams[tIdx];
  const teamName = team.name ? `"${team.name}"` : `Lag ${tIdx + 1}`;

  const confirmDelete = window.confirm(`Vil du slette ${teamName} fra quizen?`);
  if (!confirmDelete) return;

  saveUndoSnapshot();
  appState.teams.splice(tIdx, 1);
  appState.isSorted = false;
  renderTable();
  notifyChange(true);
}

/**
 * Handlinger: Legg til ny runde
 */
function addRound() {
  if (!appState) return;
  saveUndoSnapshot();

  appState.roundCount += 1;
  const roundNum = appState.roundCount;
  appState.roundNames.push(`Runde ${roundNum}`);

  appState.teams.forEach(team => {
    if (!Array.isArray(team.scores)) {
      team.scores = [];
    }
    team.scores.push('');
  });

  appState.isSorted = false;
  renderTable();
  notifyChange(true);
}

/**
 * Handlinger: Fjern runde
 */
function deleteRound(rIdx) {
  if (!appState || appState.roundCount <= 1) {
    alert('Du må ha minst én runde i quizen.');
    return;
  }

  const roundTitle = appState.roundNames[rIdx] || `Runde ${rIdx + 1}`;
  
  // Sjekk om det finnes poeng i runden
  let hasScores = false;
  appState.teams.forEach(team => {
    if (team.scores && team.scores[rIdx] && team.scores[rIdx].trim() !== '') {
      hasScores = true;
    }
  });

  if (hasScores) {
    const proceed = window.confirm(`Det er allerede ført poeng i ${roundTitle}. Er du sikker på at du vil fjerne denne runden?`);
    if (!proceed) return;
  }

  saveUndoSnapshot();
  appState.roundCount -= 1;
  appState.roundNames.splice(rIdx, 1);

  appState.teams.forEach(team => {
    if (Array.isArray(team.scores)) {
      team.scores.splice(rIdx, 1);
    }
  });

  appState.isSorted = false;
  renderTable();
  notifyChange(true);
}

/**
 * Handlinger: Sorter etter poeng med tie-breaker
 */
function sortTeams() {
  if (!appState || !window.QuizScoring) return;
  saveUndoSnapshot();

  const sorted = window.QuizScoring.sortTeamsWithTieBreaker(appState.teams, appState.roundCount);
  appState.teams = sorted;
  appState.isSorted = true;

  renderTable();
  notifyChange(true);
}

/**
 * Handlinger: Nullstill alle poeng (behold lag og runder)
 */
function clearAllScores() {
  if (!appState) return;
  const ok = window.confirm('Vil du nullstille alle poeng til blankt? Lagene og rundene beholdes.');
  if (!ok) return;

  saveUndoSnapshot();
  appState.teams.forEach(team => {
    team.scores = Array(appState.roundCount).fill('');
    team.tieBreakerNote = '';
    team.rank = 1;
  });
  appState.isSorted = false;

  renderTable();
  notifyChange(true);
}

function saveUndoSnapshot() {
  if (window.QuizStorage) {
    window.QuizStorage.pushUndoState(appState);
  }
}

function notifyChange(saveToStorage = true) {
  if (typeof onStateChangeCallback === 'function') {
    onStateChangeCallback(appState, saveToStorage);
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.QuizSpreadsheet = {
  initSpreadsheet,
  updateState,
  getState,
  renderTable,
  addTeam,
  deleteTeam,
  addRound,
  deleteRound,
  sortTeams,
  clearAllScores
};
