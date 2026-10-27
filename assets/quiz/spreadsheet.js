/**
 * spreadsheet.js - Regneark-tabell, dynamisk rendering, tastaturnavigasjon og presentasjonsmodus
 * For Quiz Kraft (ranheimkraft.no)
 */

let appState = null;
let onStateChangeCallback = null;

// Visningsinnstillinger
let currentFilter = 'all'; // 'all', 'top5', 'top10', 'top15', 'page'
let currentPage = 1;
const PAGE_SIZE = 12; // 12 lag per side ved rullering/karusell
let is2ColumnLayout = false;
let isPresentationMode = false;
let isLastRoundHidden = false; // "Cliffhanger / Hemmelig finale"

function initSpreadsheet(state, onStateChange) {
  appState = state;
  onStateChangeCallback = onStateChange;

  const savedHighlights = localStorage.getItem('quiz_kraft_highlights');
  if (savedHighlights !== null) {
    appState.showHighlights = (savedHighlights === 'true');
  } else if (appState.showHighlights === undefined) {
    appState.showHighlights = true;
  }

  renderTable();
}

function setShowHighlights(enabled) {
  if (!appState) return;
  appState.showHighlights = !!enabled;
  localStorage.setItem('quiz_kraft_highlights', appState.showHighlights ? 'true' : 'false');
  renderTable();
}

function getShowHighlights() {
  if (!appState) return true;
  return appState.showHighlights !== false;
}

function updateState(newState) {
  appState = newState;
  renderTable();
}

function getState() {
  return appState;
}

function setViewFilter(filter) {
  currentFilter = filter;
  currentPage = 1;
  renderTable();
}

function getViewFilter() {
  return currentFilter;
}

function set2ColumnLayout(enabled) {
  is2ColumnLayout = enabled;
  renderTable();
}

function get2ColumnLayout() {
  return is2ColumnLayout;
}

function setPresentationMode(enabled) {
  isPresentationMode = enabled;
  renderTable();
}

function getPresentationMode() {
  return isPresentationMode;
}

function setHideLastRound(hidden) {
  isLastRoundHidden = hidden;
  renderTable();
}

function getHideLastRound() {
  return isLastRoundHidden;
}

function setPage(page) {
  currentPage = page;
  renderTable();
}

function getPage() {
  return currentPage;
}

function getTotalPages() {
  const teams = appState ? (appState.teams || []) : [];
  return Math.max(1, Math.ceil(teams.length / PAGE_SIZE));
}

function nextPage() {
  const total = getTotalPages();
  currentPage = (currentPage % total) + 1;
  renderTable();
  return currentPage;
}

function prevPage() {
  const total = getTotalPages();
  currentPage = currentPage === 1 ? total : currentPage - 1;
  renderTable();
  return currentPage;
}

/**
 * Filtrerer lagene basert på aktivt filter (Alle, Topp 5, Topp 10, Topp 15, eller side)
 * I presentasjonsmodus vises kun aktive lag som deltar i kveld.
 */
function getVisibleTeams() {
  const allTeams = appState.teams || [];
  // I presentasjonsmodus vises kun lag som faktisk deltar
  const teams = isPresentationMode 
    ? allTeams.filter(t => t.active !== false) 
    : allTeams;

  if (currentFilter === 'top5') {
    return teams.slice(0, 5);
  } else if (currentFilter === 'top10') {
    return teams.slice(0, 10);
  } else if (currentFilter === 'top15') {
    return teams.slice(0, 15);
  } else if (currentFilter === 'page') {
    const start = (currentPage - 1) * PAGE_SIZE;
    return teams.slice(start, start + PAGE_SIZE);
  }
  return teams;
}

/**
 * Hovedfunksjon for rendering av regneark-tabellen
 */
function renderTable() {
  const container = document.getElementById('spreadsheet-container');
  if (!container || !appState) return;

  const roundCount = appState.roundCount || 5;
  const roundNames = appState.roundNames || [];
  const allTeams = appState.teams || [];
  const visibleTeams = getVisibleTeams();

  // Finn indeksen for siste spilte runde hvis "Hemmelig finale" er aktivert
  const lastPlayedIdx = window.QuizScoring ? window.QuizScoring.getLastPlayedRoundIndex(allTeams, roundCount) : -1;

  // Bestem om 2-kolonne skal brukes (f.eks. ved mange lag på bred skjerm)
  const use2Columns = is2ColumnLayout && visibleTeams.length > 8;

  let html = '';

  // Informasjonslinje for aktivt filter (f.eks. "Viser Topp 10 av 25 lag")
  if (currentFilter !== 'all' || isPresentationMode) {
    html += `
      <div class="presentation-info-bar">
        <span class="info-tag">
          ${currentFilter === 'all' ? `Totalt ${allTeams.length} lag registrert` : ''}
          ${currentFilter === 'top5' ? `Viser Topp 5 av ${allTeams.length} lag` : ''}
          ${currentFilter === 'top10' ? `Viser Topp 10 av ${allTeams.length} lag` : ''}
          ${currentFilter === 'top15' ? `Viser Topp 15 av ${allTeams.length} lag` : ''}
          ${currentFilter === 'page' ? `Side ${currentPage} av ${getTotalPages()} (Lag ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, allTeams.length)} av ${allTeams.length})` : ''}
        </span>
        ${isLastRoundHidden && lastPlayedIdx >= 0 ? `
          <span class="cliffhanger-tag">
            🔒 Siste runde (${roundNames[lastPlayedIdx] || 'Runde ' + (lastPlayedIdx + 1)}) er hemmelig på storskjerm!
          </span>
        ` : ''}
      </div>
    `;
  }

  if (use2Columns) {
    // 2-KOLONNE VISNING FOR 15–30 LAG PÅ STORSKJERM
    const half = Math.ceil(visibleTeams.length / 2);
    const leftTeams = visibleTeams.slice(0, half);
    const rightTeams = visibleTeams.slice(half);

    html += `
      <div class="quiz-grid-2col">
        <div class="quiz-col-left">
          ${buildTableHtml(leftTeams, 0, roundCount, roundNames, lastPlayedIdx, true)}
        </div>
        <div class="quiz-col-right">
          ${buildTableHtml(rightTeams, half, roundCount, roundNames, lastPlayedIdx, true)}
        </div>
      </div>
    `;
  } else {
    // STANDARD 1-KOLONNE VISNING
    html += buildTableHtml(visibleTeams, 0, roundCount, roundNames, lastPlayedIdx, false);
  }

  container.innerHTML = html;
  bindTableEvents(container);
  syncCountInputs();
}

/**
 * Synkroniserer nummer-inndatafeltene for antall lag og runder i verktøylinjen
 */
function syncCountInputs() {
  const teamInput = document.getElementById('input-team-count');
  const roundInput = document.getElementById('input-round-count');
  if (teamInput && appState) {
    const activeCount = appState.teams ? appState.teams.filter(t => t.active !== false).length : 0;
    teamInput.value = activeCount;
    teamInput.title = `Det er ${activeCount} aktive lag (av ${appState.teams.length} lag i banken)`;
  }
  if (roundInput && appState) {
    roundInput.value = appState.roundCount || 0;
  }
}

/**
 * Setter antall lag direkte ved å skrive inn et tall.
 * Bevarer lagnavn i banken ved å deaktivere lag over tallet i stedet for å slette dem!
 */
function setTeamCount(newCount) {
  if (!appState) return;
  newCount = parseInt(newCount, 10);
  if (isNaN(newCount) || newCount < 1) newCount = 1;

  saveUndoSnapshot();

  if (newCount <= appState.teams.length) {
    // Aktiver de første newCount lagene, deaktiver resten slik at lagnavn aldri slettes ved et uhell!
    appState.teams.forEach((team, idx) => {
      team.active = (idx < newCount);
    });
  } else {
    // Aktiver alle eksisterende lag
    appState.teams.forEach(team => {
      team.active = true;
    });
    // Og legg til nye lag opp til newCount
    for (let i = appState.teams.length; i < newCount; i++) {
      appState.teams.push({
        id: `team_${Date.now()}_${i + 1}`,
        name: `Lag ${i + 1}`,
        scores: Array(appState.roundCount).fill(''),
        rank: i + 1,
        tieBreakerNote: '',
        active: true
      });
    }
  }

  appState.isSorted = false;
  renderTable();
  notifyChange(true);
}

/**
 * Setter antall runder direkte ved å skrive inn et tall
 */
function setRoundCount(newCount) {
  if (!appState) return;
  newCount = parseInt(newCount, 10);
  if (isNaN(newCount) || newCount < 1) newCount = 1;
  const currentCount = appState.roundCount;
  if (newCount === currentCount) return;

  if (newCount < currentCount) {
    const hasScores = appState.teams.some(t => t.scores && t.scores.slice(newCount).some(s => s && s.trim() !== ''));
    if (hasScores) {
      const ok = window.confirm(`Vil du redusere fra ${currentCount} til ${newCount} runder? Poengene i de siste rundene vil bli fjernet.`);
      if (!ok) {
        syncCountInputs();
        return;
      }
    }
    saveUndoSnapshot();
    appState.roundCount = newCount;
    appState.roundNames = appState.roundNames.slice(0, newCount);
    appState.teams.forEach(t => {
      if (Array.isArray(t.scores)) {
        t.scores = t.scores.slice(0, newCount);
      }
    });
  } else {
    saveUndoSnapshot();
    for (let r = currentCount; r < newCount; r++) {
      appState.roundNames.push(`Runde ${r + 1}`);
      appState.teams.forEach(t => {
        if (!Array.isArray(t.scores)) t.scores = [];
        t.scores.push('');
      });
    }
    appState.roundCount = newCount;
  }

  appState.isSorted = false;
  renderTable();
  notifyChange(true);
}

/**
 * Beregner en myk, gradientert farge for SUM-kolonnen basert på plassering / poeng.
 * Sikrer ekstremt høy lesbarhet med kullsort tekst i lys modus og hvit tekst i mørk modus.
 */
function getSumGradientStyle(total, minTotal, maxTotal, isInactive) {
  if (isInactive || total === null || total === undefined || total === 0 || maxTotal === 0) {
    return '';
  }
  const ratio = (maxTotal > minTotal) ? ((total - minTotal) / (maxTotal - minTotal)) : 1.0;

  // Lys modus: Myk champagnegull (topp) til ren lys grå/skifer (bunn)
  const r = Math.round(241 + ratio * (254 - 241));
  const g = Math.round(245 + ratio * (240 - 245));
  const b = Math.round(249 + ratio * (138 - 249));

  // Mørk modus: Dyp bronse (topp) til mørk skifer (bunn)
  const dr = Math.round(30 + ratio * (78 - 30));
  const dg = Math.round(41 + ratio * (62 - 41));
  const db = Math.round(59 + ratio * (19 - 59));

  return `background-color: rgb(${r}, ${g}, ${b}) !important; color: #000000 !important; --dark-sum-bg: rgb(${dr}, ${dg}, ${db});`;
}

function applySumGradientToElement(el, total, minTotal, maxTotal, isInactive) {
  if (!el) return;
  if (isInactive || total === null || total === undefined || total === 0 || maxTotal === 0) {
    el.style.backgroundColor = '';
    el.style.color = '';
    el.style.removeProperty('--dark-sum-bg');
    return;
  }
  const ratio = (maxTotal > minTotal) ? ((total - minTotal) / (maxTotal - minTotal)) : 1.0;

  const r = Math.round(241 + ratio * (254 - 241));
  const g = Math.round(245 + ratio * (240 - 245));
  const b = Math.round(249 + ratio * (138 - 249));

  const dr = Math.round(30 + ratio * (78 - 30));
  const dg = Math.round(41 + ratio * (62 - 41));
  const db = Math.round(59 + ratio * (19 - 59));

  el.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  el.style.color = '#000000';
  el.style.setProperty('--dark-sum-bg', `rgb(${dr}, ${dg}, ${db})`);
}

/**
 * Bygger HTML-strengen for selve tabellen
 */
function buildTableHtml(teamsList, startIndexOffset, roundCount, roundNames, lastPlayedIdx, isCompact) {
  const isPres = isPresentationMode;
  const allTeams = appState.teams || [];
  const highlightsEnabled = appState.showHighlights !== false;

  // Beregn rundevinnere, dårligste/laveste runde og hvilke runder som er påbegynt
  const roundMaxScores = [];
  const roundMinScores = [];
  const roundHasStarted = [];

  for (let r = 0; r < roundCount; r++) {
    let max = -Infinity;
    let min = Infinity;
    let started = false;
    let count = 0;
    allTeams.forEach(t => {
      if (t.active !== false) {
        const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
        if (val !== null) {
          started = true;
          count++;
          if (val > max) max = val;
          if (val < min) min = val;
        }
      }
    });
    roundMaxScores.push(max > 0 ? max : null);
    // Uthev laveste score i runden hvis det er minst 2 distinkte poengsummer
    roundMinScores.push(count > 1 && min < max ? min : null);
    roundHasStarted.push(started);
  }

  // Beregn min og maks total for gradert fargelegging av SUM-kolonnen
  const activeTeams = allTeams.filter(t => t.active !== false);
  const activeTotals = activeTeams.map(t => window.QuizScoring ? window.QuizScoring.calculateTeamTotal(t, roundCount) : 0);
  const maxTotal = activeTotals.length > 0 ? Math.max(...activeTotals) : 0;
  const minTotal = activeTotals.length > 0 ? Math.min(...activeTotals) : 0;

  let html = `
    <table class="quiz-table ${isPres ? 'quiz-table-presentation' : ''} ${isCompact ? 'quiz-table-compact' : ''}" role="grid" aria-label="Quiz Poengtavle">
      <thead>
        <tr>
          <th class="col-rank" scope="col">#</th>
          <th class="col-team" scope="col">Lagnavn</th>
  `;

  // Runde-kolonner
  for (let r = 0; r < roundCount; r++) {
    const roundTitle = roundNames[r] || `Runde ${r + 1}`;
    const isHiddenFinal = isLastRoundHidden && r === lastPlayedIdx;

    html += `
      <th class="col-round ${isHiddenFinal ? 'col-round-hidden' : ''}" scope="col">
        <div class="th-round-header">
          ${isPres ? `
            <span class="pres-round-title">${escapeHtml(roundTitle)}</span>
          ` : `
            <input type="text" class="round-title-input" data-round-idx="${r}" value="${escapeHtml(roundTitle)}" aria-label="Endre navn på runde ${r + 1}" title="Klikk for å endre tittel på runden" />
            ${roundCount > 1 ? `<button type="button" class="btn-remove-round" data-round-idx="${r}" title="Fjern runde ${r + 1}">×</button>` : ''}
          `}
        </div>
      </th>
    `;
  }

  // Sammenlagt og Merknad
  html += `
          <th class="col-total" scope="col">SUM</th>
          <th class="col-note" scope="col">Merknad</th>
          ${!isPres ? `<th class="col-actions no-print" scope="col">Fjern</th>` : ''}
        </tr>
      </thead>
      <tbody>
  `;

  if (teamsList.length === 0) {
    html += `
      <tr>
        <td colspan="${roundCount + (isPres ? 4 : 5)}" class="empty-table-msg">
          Ingen lag i denne visningen.
        </td>
      </tr>
    `;
  } else {
    teamsList.forEach((team, localIdx) => {
      const realIdx = startIndexOffset + localIdx;
      const isInactive = team.active === false;
      const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
      const rank = team.rank || (realIdx + 1);
      
      let rankBadge = `${rank}.`;
      let rowHighlightClass = isInactive ? 'team-row-inactive' : '';

      if (!isInactive && appState.isSorted) {
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

      if (isInactive) {
        rankBadge = '-';
      }

      html += `
        <tr class="team-row ${rowHighlightClass}" data-team-idx="${realIdx}">
          <td class="col-rank">
            <span class="rank-badge" title="${isInactive ? 'Laget deltar ikke i kveld' : 'Plassering: ' + rank + '.'}">${rankBadge}</span>
          </td>
          <td class="col-team">
            ${isPres ? `
              <span class="pres-team-name">${escapeHtml(team.name || 'Lag ' + (realIdx + 1))}</span>
            ` : `
              <div class="team-name-cell-wrap">
                <label class="checkbox-attendance-wrap" title="${isInactive ? 'Klikk for å aktivere laget (deltar i kveld)' : 'Fjern hake hvis laget ikke deltar i kveld'}">
                  <input type="checkbox" class="team-active-checkbox" data-team-idx="${realIdx}" ${!isInactive ? 'checked' : ''} aria-label="Deltar i kveld" />
                </label>
                <input type="text" 
                       class="team-name-input ${isInactive ? 'name-inactive' : ''}" 
                       data-team-idx="${realIdx}" 
                       value="${escapeHtml(team.name || '')}" 
                       placeholder="Skriv lagnavn..." 
                       aria-label="Lagnavn for lag ${realIdx + 1}" />
              </div>
            `}
          </td>
      `;

      // Poengceller
      for (let r = 0; r < roundCount; r++) {
        const rawScore = team.scores ? team.scores[r] : '';
        const parsed = window.QuizScoring ? window.QuizScoring.parseScore(rawScore) : null;
        const isHiddenFinal = isLastRoundHidden && r === lastPlayedIdx;

        // Farge på rundevinner, dårligste/laveste score og manglende poeng
        const isWinner = highlightsEnabled && !isInactive && roundMaxScores[r] !== null && parsed !== null && parsed === roundMaxScores[r];
        const isLowest = highlightsEnabled && !isInactive && roundMinScores[r] !== null && parsed !== null && parsed === roundMinScores[r];
        const isMissing = highlightsEnabled && !isInactive && roundHasStarted[r] && (rawScore === '' || rawScore === null || rawScore === undefined);

        let roundCellClass = 'col-round';
        if (isHiddenFinal) roundCellClass += ' col-round-hidden';
        else if (isWinner) roundCellClass += ' cell-round-winner';
        else if (isLowest) roundCellClass += ' cell-round-lowest';
        else if (isMissing) roundCellClass += ' cell-missing-score';

        const cellTitle = isWinner 
          ? '🏆 Beste poengsum i ' + (roundNames[r] || 'runde ' + (r + 1)) 
          : (isLowest 
              ? '🔻 Laveste poengsum i ' + (roundNames[r] || 'runde ' + (r + 1)) 
              : (isMissing ? '⚠️ Dette laget mangler poeng i ' + (roundNames[r] || 'runde ' + (r + 1)) : ''));

        html += `
          <td class="${roundCellClass}" title="${cellTitle}">
            ${isPres ? `
              <span class="pres-score ${isWinner ? 'pres-winner' : ''} ${isLowest ? 'pres-lowest' : ''}">${isHiddenFinal ? '❓' : (rawScore !== '' ? escapeHtml(rawScore) : '-')}</span>
            ` : `
              <input type="text" 
                     inputmode="decimal"
                     class="score-input ${isWinner ? 'score-winner' : ''} ${isLowest ? 'score-lowest' : ''} ${isMissing ? 'score-missing' : ''}" 
                     data-team-idx="${realIdx}" 
                     data-round-idx="${r}" 
                     value="${escapeHtml(rawScore)}" 
                     placeholder="${isMissing ? 'Mangler' : '-'}" 
                     ${isInactive ? 'disabled' : ''}
                     aria-label="Poeng for ${escapeHtml(team.name || 'Lag ' + (realIdx + 1))}, runde ${r + 1}" />
            `}
          </td>
        `;
      }

      // Sammenlagt (hvis siste runde er hemmelig, vis enten sum før siste runde eller med ?)
      let displayTotal = window.QuizScoring ? window.QuizScoring.formatScore(total) : total;
      if (isInactive) {
        displayTotal = '-';
      } else if (isPres && isLastRoundHidden && lastPlayedIdx >= 0) {
        displayTotal = '🔒 ?';
      }

      const sumGradientStyle = getSumGradientStyle(total, minTotal, maxTotal, isInactive);

      html += `
          <td class="col-total" style="${sumGradientStyle}">
            <span class="total-display" id="total-${realIdx}" aria-live="polite">${displayTotal}</span>
          </td>
          <td class="col-note">
            ${isInactive ? '<span class="note-inactive">Deltar ikke</span>' : (team.tieBreakerNote ? `<span class="tie-breaker-badge">${escapeHtml(team.tieBreakerNote)}</span>` : '<span class="note-empty">-</span>')}
          </td>
          ${!isPres ? `
            <td class="col-actions no-print">
              <button type="button" class="btn-delete-team" data-team-idx="${realIdx}" title="Slett dette laget">Slett</button>
            </td>
          ` : ''}
        </tr>
      `;
    });
  }

  html += `
      </tbody>
  `;

  // Gjennomsnitt per runde (kun for aktive lag)
  if (!isPres) {
    const activeTeams = teamsList.filter(t => t.active !== false);

    html += `
      <tfoot>
        <tr class="summary-row">
          <td class="col-rank">Snitt</td>
          <td class="col-team"><strong>${activeTeams.length} av ${teamsList.length} lag</strong></td>
    `;

    for (let r = 0; r < roundCount; r++) {
      let rSum = 0;
      let rCount = 0;
      activeTeams.forEach(t => {
        const parsed = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
        if (parsed !== null) {
          rSum += parsed;
          rCount++;
        }
      });
      const avg = rCount > 0 ? (rSum / rCount) : null;
      const winnerName = roundMaxScores[r] !== null ? `Beste: ${window.QuizScoring.formatScore(roundMaxScores[r])} p` : '';

      html += `
        <td class="col-round summary-cell" title="Snitt runde ${r + 1}: ${avg !== null ? window.QuizScoring.formatScore(avg) : '-'}. ${winnerName}">
          <span class="avg-label">Snitt:</span>
          <span class="avg-value">${avg !== null ? window.QuizScoring.formatScore(avg) : '-'}</span>
        </td>
      `;
    }

    let grandTotal = 0;
    activeTeams.forEach(t => {
      grandTotal += window.QuizScoring ? window.QuizScoring.calculateTeamTotal(t, roundCount) : 0;
    });
    const teamAvg = activeTeams.length > 0 ? (grandTotal / activeTeams.length) : null;

    html += `
            <td class="col-total summary-cell">
              <span class="avg-label">Totalt:</span>
              <span class="avg-value">${teamAvg !== null ? window.QuizScoring.formatScore(teamAvg) : '-'}</span>
            </td>
            <td class="col-note summary-cell"></td>
            <td class="col-actions no-print"></td>
          </tr>
        </tfoot>
    `;
  }

  html += `</table>`;
  return html;
}

/**
 * Oppdaterer visuelle fremhevinger for rundevinnere (grønt) og manglende poeng (amber)
 * uten å bygge opp tabell-DOM-en på nytt.
 */
function updateRoundHighlights(container) {
  if (!container || !appState) return;
  const roundCount = appState.roundCount || 0;
  const allTeams = appState.teams || [];
  const highlightsEnabled = appState.showHighlights !== false;

  const roundMaxScores = [];
  const roundMinScores = [];
  const roundHasStarted = [];

  for (let r = 0; r < roundCount; r++) {
    let max = -Infinity;
    let min = Infinity;
    let started = false;
    let count = 0;
    allTeams.forEach(t => {
      if (t.active !== false) {
        const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
        if (val !== null) {
          started = true;
          count++;
          if (val > max) max = val;
          if (val < min) min = val;
        }
      }
    });
    roundMaxScores.push(max > 0 ? max : null);
    roundMinScores.push(count > 1 && min < max ? min : null);
    roundHasStarted.push(started);
  }

  // Beregn min og maks total for å oppdatere de graderte sum-fargene i sanntid
  const activeTeams = allTeams.filter(t => t.active !== false);
  const activeTotals = activeTeams.map(t => window.QuizScoring ? window.QuizScoring.calculateTeamTotal(t, roundCount) : 0);
  const maxTotal = activeTotals.length > 0 ? Math.max(...activeTotals) : 0;
  const minTotal = activeTotals.length > 0 ? Math.min(...activeTotals) : 0;

  const rows = container.querySelectorAll('tr.team-row');
  rows.forEach(row => {
    const tIdx = parseInt(row.dataset.teamIdx, 10);
    const team = appState.teams[tIdx];
    if (!team) return;
    const isInactive = team.active === false;

    // Oppdater gradert farge på sum-cellen
    const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
    const tdTotal = row.querySelector('td.col-total');
    if (tdTotal) {
      applySumGradientToElement(tdTotal, total, minTotal, maxTotal, isInactive);
    }

    for (let r = 0; r < roundCount; r++) {
      const rawScore = team.scores ? team.scores[r] : '';
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(rawScore) : null;

      const isWinner = highlightsEnabled && !isInactive && roundMaxScores[r] !== null && parsed !== null && parsed === roundMaxScores[r];
      const isLowest = highlightsEnabled && !isInactive && roundMinScores[r] !== null && parsed !== null && parsed === roundMinScores[r];
      const isMissing = highlightsEnabled && !isInactive && roundHasStarted[r] && (rawScore === '' || rawScore === null || rawScore === undefined);

      const input = row.querySelector(`.score-input[data-round-idx="${r}"]`);
      if (input) {
        const td = input.closest('td.col-round');
        if (td) {
          td.classList.toggle('cell-round-winner', isWinner);
          td.classList.toggle('cell-round-lowest', isLowest);
          td.classList.toggle('cell-missing-score', isMissing);
          td.title = isWinner 
            ? `🏆 Beste poengsum i runde ${r + 1}` 
            : (isLowest ? `🔻 Laveste poengsum i runde ${r + 1}` : (isMissing ? `⚠️ Mangler poeng i runde ${r + 1}` : ''));
        }
        input.classList.toggle('score-winner', isWinner);
        input.classList.toggle('score-lowest', isLowest);
        input.classList.toggle('score-missing', isMissing);
        input.placeholder = isMissing ? 'Mangler' : '-';
      }
    }
  });

  const summaryCells = container.querySelectorAll('tfoot td.col-round.summary-cell');
  summaryCells.forEach((td, r) => {
    let rSum = 0;
    let rCount = 0;
    const activeTeams = allTeams.filter(t => t.active !== false);
    activeTeams.forEach(t => {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      if (parsed !== null) {
        rSum += parsed;
        rCount++;
      }
    });
    const avg = rCount > 0 ? (rSum / rCount) : null;
    const avgValSpan = td.querySelector('.avg-value');
    if (avgValSpan && window.QuizScoring) {
      avgValSpan.textContent = avg !== null ? window.QuizScoring.formatScore(avg) : '-';
    }
    const winnerText = roundMaxScores[r] !== null ? `Beste: ${window.QuizScoring.formatScore(roundMaxScores[r])} p` : '';
    td.title = `Snitt runde ${r + 1}: ${avg !== null ? window.QuizScoring.formatScore(avg) : '-'}. ${winnerText}`;
  });
}

/**
 * Knytter opp hendelser for inntasting, tastaturnavigasjon og sletting
 */
function bindTableEvents(container) {
  // 1. Poengfelter
  const scoreInputs = container.querySelectorAll('.score-input');
  scoreInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const tIdx = parseInt(e.target.dataset.teamIdx, 10);
      const rIdx = parseInt(e.target.dataset.roundIdx, 10);
      const val = e.target.value;

      appState.teams[tIdx].scores[rIdx] = val;
      appState.isSorted = false;
      appState.teams.forEach(t => t.tieBreakerNote = '');

      const totalSpan = document.getElementById(`total-${tIdx}`);
      if (totalSpan && window.QuizScoring) {
        const newTotal = window.QuizScoring.calculateTeamTotal(appState.teams[tIdx], appState.roundCount);
        totalSpan.textContent = window.QuizScoring.formatScore(newTotal);
      }

      updateRoundHighlights(container);
      notifyChange(false);
    });

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
      updateRoundHighlights(container);
      notifyChange(true);
    });

    input.addEventListener('keydown', (e) => {
      handleScoreKeydown(e, input);
    });
  });

  // 2. Lagnavn
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
        e.preventDefault();
        focusCell(tIdx, 0);
      }
    });

    input.addEventListener('blur', () => {
      notifyChange(true);
    });
  });

  // 3. Rundenavn
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

  // 6. Håndter deltakelse (av/på for hvert lag)
  const attendanceCheckboxes = container.querySelectorAll('.team-active-checkbox');
  attendanceCheckboxes.forEach(chk => {
    chk.addEventListener('change', (e) => {
      const tIdx = parseInt(e.target.dataset.teamIdx, 10);
      saveUndoSnapshot();
      appState.teams[tIdx].active = e.target.checked;
      renderTable();
      notifyChange(true);
    });
  });
}

function handleScoreKeydown(e, currentInput) {
  const tIdx = parseInt(currentInput.dataset.teamIdx, 10);
  const rIdx = parseInt(currentInput.dataset.roundIdx, 10);
  const teamCount = appState.teams.length;
  const roundCount = appState.roundCount;

  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (tIdx + 1 < teamCount) {
      focusCell(tIdx + 1, rIdx);
    } else {
      if (rIdx + 1 < roundCount) {
        focusCell(0, rIdx + 1);
      } else {
        currentInput.select();
      }
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (tIdx - 1 >= 0) {
      focusCell(tIdx - 1, rIdx);
    } else if (rIdx - 1 >= 0) {
      focusCell(teamCount - 1, rIdx - 1);
    }
  } else if (e.key === 'ArrowRight') {
    if (currentInput.selectionStart === currentInput.value.length) {
      if (rIdx + 1 < roundCount) {
        e.preventDefault();
        focusCell(tIdx, rIdx + 1);
      }
    }
  } else if (e.key === 'ArrowLeft') {
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

  setTimeout(() => {
    focusCell(appState.teams.length - 1, 'name');
  }, 50);
}

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

function deleteRound(rIdx) {
  if (!appState || appState.roundCount <= 1) {
    alert('Du må ha minst én runde i quizen.');
    return;
  }

  const roundTitle = appState.roundNames[rIdx] || `Runde ${rIdx + 1}`;
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

function sortTeams() {
  if (!appState || !window.QuizScoring) return;
  saveUndoSnapshot();

  const activeTeams = appState.teams.filter(t => t.active !== false);
  const inactiveTeams = appState.teams.filter(t => t.active === false);

  const sortedActive = window.QuizScoring.sortTeamsWithTieBreaker(activeTeams, appState.roundCount);
  
  inactiveTeams.forEach(t => {
    t.rank = '-';
    t.tieBreakerNote = 'Deltar ikke';
  });

  appState.teams = [...sortedActive, ...inactiveTeams];
  appState.isSorted = true;

  renderTable();
  notifyChange(true);
}

/**
 * Sorterer lagene alfabetisk etter lagnavn (A–Å)
 */
function sortTeamsByName() {
  if (!appState) return;
  saveUndoSnapshot();

  const activeTeams = appState.teams.filter(t => t.active !== false);
  const inactiveTeams = appState.teams.filter(t => t.active === false);

  activeTeams.sort((a, b) => {
    const nameA = (a.name || '').trim();
    const nameB = (b.name || '').trim();
    return nameA.localeCompare(nameB, 'no', { sensitivity: 'base', numeric: true });
  });

  activeTeams.forEach((t, i) => {
    t.rank = i + 1;
    t.tieBreakerNote = '';
  });

  inactiveTeams.forEach(t => {
    t.rank = '-';
    t.tieBreakerNote = 'Deltar ikke';
  });

  appState.teams = [...activeTeams, ...inactiveTeams];
  appState.isSorted = false;

  renderTable();
  notifyChange(true);
}

function clearAllScores() {
  if (!appState) return;
  const ok = window.confirm('Er du sikker på at du vil tømme alle innførte poengsummer?\n\nLagnavn, antall runder og frammøte blir bevart.');
  if (!ok) return;

  saveUndoSnapshot();
  appState.teams.forEach(team => {
    team.scores = Array(appState.roundCount).fill('');
    team.tieBreakerNote = '';
    if (team.active !== false) {
      team.rank = null;
    } else {
      team.rank = '-';
      team.tieBreakerNote = 'Deltar ikke';
    }
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
  setTeamCount,
  deleteTeam,
  addRound,
  setRoundCount,
  deleteRound,
  sortTeams,
  sortTeamsByName,
  clearAllScores,
  setShowHighlights,
  getShowHighlights,
  setViewFilter,
  getViewFilter,
  set2ColumnLayout,
  get2ColumnLayout,
  setPresentationMode,
  getPresentationMode,
  setHideLastRound,
  getHideLastRound,
  setPage,
  getPage,
  getTotalPages,
  nextPage,
  prevPage
};
