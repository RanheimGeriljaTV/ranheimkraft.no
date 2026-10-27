/**
 * round-analysis.js - Analyse av rundevinnere, statistikk og interaktiv HTML5-graf
 * For Quiz Kraft (ranheimkraft.no)
 */

/**
 * Finner hvem som var best i hver runde
 */
function getRoundWinners(teams, roundCount, roundNames) {
  const rounds = [];

  for (let r = 0; r < roundCount; r++) {
    const roundTitle = (roundNames && roundNames[r]) || `Runde ${r + 1}`;
    let maxScore = -Infinity;
    let minScore = Infinity;
    let sumScore = 0;
    let scoreCount = 0;

    // Finn max, min og snitt
    teams.forEach(t => {
      const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      if (val !== null) {
        if (val > maxScore) maxScore = val;
        if (val < minScore) minScore = val;
        sumScore += val;
        scoreCount++;
      }
    });

    if (scoreCount === 0) {
      rounds.push({
        roundIndex: r,
        roundTitle: roundTitle,
        hasScores: false,
        maxScore: 0,
        minScore: 0,
        avgScore: 0,
        winners: []
      });
      continue;
    }

    // Finn alle lag som oppnådde maxScore
    const winners = [];
    teams.forEach(t => {
      const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      if (val !== null && val === maxScore) {
        winners.push({
          name: t.name,
          score: val
        });
      }
    });

    rounds.push({
      roundIndex: r,
      roundTitle: roundTitle,
      hasScores: true,
      maxScore: maxScore,
      minScore: minScore,
      avgScore: Math.round((sumScore / scoreCount) * 10) / 10,
      winners: winners
    });
  }

  return rounds;
}

/**
 * Beregner hvor mange rundeseiere hvert lag har
 */
function getTeamWinsTally(teams, roundWinners) {
  const tally = {};
  teams.forEach(t => {
    tally[t.name] = {
      name: t.name,
      wins: 0,
      roundsWon: [],
      bestScore: 0
    };
  });

  roundWinners.forEach(rw => {
    if (!rw.hasScores) return;
    rw.winners.forEach(w => {
      if (!tally[w.name]) {
        tally[w.name] = { name: w.name, wins: 0, roundsWon: [], bestScore: 0 };
      }
      tally[w.name].wins += 1;
      tally[w.name].roundsWon.push(rw.roundTitle);
    });
  });

  // Finn også beste enkeltscore for hvert lag
  teams.forEach(t => {
    let best = 0;
    if (Array.isArray(t.scores)) {
      t.scores.forEach(s => {
        const val = window.QuizScoring ? window.QuizScoring.parseScore(s) : null;
        if (val !== null && val > best) best = val;
      });
    }
    if (tally[t.name]) {
      tally[t.name].bestScore = best;
    }
  });

  return Object.values(tally).sort((a, b) => b.wins - a.wins || b.bestScore - a.bestScore);
}

/**
 * Beregner akkumulerte poeng runde for runde (for tidslinje og grafer)
 */
function getCumulativeScores(teams, roundCount) {
  return teams.map(team => {
    const cumulative = [];
    let runningTotal = 0;
    for (let r = 0; r < roundCount; r++) {
      const val = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      if (val !== null) {
        runningTotal += val;
      }
      cumulative.push(Math.round(runningTotal * 100) / 100);
    }
    return {
      name: team.name,
      cumulative: cumulative,
      finalTotal: runningTotal
    };
  });
}

/**
 * Fargepalett for laglinjer i grafen (høykontrast, tydelige farger)
 */
const CHART_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#d946ef', '#eab308', '#0ea5e9', '#64748b'
];

/**
 * Tegner en ren, elegant graf på et HTML5 Canvas
 * Støtter to moduser: 'cumulative' (sammenlagt utvikling) og 'per_round' (poeng i hver enkelt runde)
 */
function drawQuizChart(canvas, teams, roundCount, roundNames, mode = 'cumulative') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Håndter høyoppløselige skjermer (Retina)
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 800;
  const height = rect.height || 420;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!teams || teams.length === 0 || roundCount === 0) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText('Ingen data å vise i grafen ennå.', width / 2, height / 2);
    return;
  }

  // Marger
  const padLeft = 60;
  const padRight = 140; // Plass til lagnavn på slutten av linjene
  const padTop = 30;
  const padBottom = 50;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Finn maks verdi for y-aksen
  let maxY = 10;
  teams.forEach(t => {
    let running = 0;
    for (let r = 0; r < roundCount; r++) {
      const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : 0;
      if (mode === 'cumulative') {
        running += val || 0;
        if (running > maxY) maxY = running;
      } else {
        if ((val || 0) > maxY) maxY = val;
      }
    }
  });

  // Rund opp maxY til pent tall
  maxY = Math.ceil(maxY / 5) * 5 || 10;

  // Tegn horisontale rutenettlinjer
  const yTicks = 5;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxY / yTicks) * i * 10) / 10;
    const y = padTop + chartH - (val / maxY) * chartH;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + chartW, y);
    ctx.stroke();

    ctx.fillText(window.QuizScoring ? window.QuizScoring.formatScore(val) : String(val), padLeft - 10, y + 4);
  }

  // Tegn x-akse etiketter (Runder)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px sans-serif';

  const xStep = roundCount > 1 ? chartW / (roundCount - 1) : chartW / 2;

  for (let r = 0; r < roundCount; r++) {
    const x = padLeft + (roundCount > 1 ? r * xStep : chartW / 2);
    const rName = (roundNames && roundNames[r]) || `R ${r + 1}`;

    // Vertikal linje
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + chartH);
    ctx.strokeStyle = '#f3f4f6';
    ctx.stroke();

    // Etikett
    ctx.fillText(rName, x, padTop + chartH + 24);
  }

  // Tegn linjer for hvert lag
  // Sorter teams slik at topplagene tegnes sist og etiketter ikke kolliderer like lett
  const sortedTeams = [...teams].sort((a, b) => {
    const totA = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(a, roundCount) : 0;
    const totB = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(b, roundCount) : 0;
    return totA - totB;
  });

  const lastPositions = [];

  sortedTeams.forEach((team, tIdx) => {
    const color = CHART_COLORS[tIdx % CHART_COLORS.length];
    const points = [];
    let running = 0;

    for (let r = 0; r < roundCount; r++) {
      const raw = team.scores ? team.scores[r] : null;
      const val = window.QuizScoring ? window.QuizScoring.parseScore(raw) : null;
      
      let yVal = 0;
      if (mode === 'cumulative') {
        if (val !== null) running += val;
        yVal = running;
      } else {
        yVal = val !== null ? val : 0;
      }

      const x = padLeft + (roundCount > 1 ? r * xStep : chartW / 2);
      const y = padTop + chartH - (yVal / maxY) * chartH;
      points.push({ x, y, val: yVal });
    }

    // Tegn linjen
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Tegn punkter
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    // Lagnavn på slutten av linjen
    const lastP = points[points.length - 1];
    let labelY = lastP.y;

    // Enkel kollisjonsdemping for etiketter
    lastPositions.forEach(prevY => {
      if (Math.abs(prevY - labelY) < 14) {
        labelY += (labelY >= prevY ? 12 : -12);
      }
    });
    lastPositions.push(labelY);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(`${team.name || 'Lag'} (${window.QuizScoring ? window.QuizScoring.formatScore(lastP.val) : lastP.val})`, lastP.x + 8, labelY + 4);
  });
}

window.QuizRoundAnalysis = {
  getRoundWinners,
  getTeamWinsTally,
  getCumulativeScores,
  drawQuizChart
};
