/**
 * excel-export.js - Generering av fullverdig Excel-arbeidsbok (.xlsx) med flere ark:
 * 1. Sammenlagt Resultater (Hovedtabell)
 * 2. Rundevinnere & Analyse (Hvem var best i hver runde, snitt, og flest seiere)
 * 3. Rundeutvikling (Klargjort for Excels innebygde linjediagrammer og grafer)
 * For Quiz Kraft (ranheimkraft.no)
 */

function exportQuizToExcel(state) {
  if (typeof XLSX === 'undefined') {
    alert('Feil: Excel-biblioteket (xlsx.full.min.js) ble ikke funnet.');
    return;
  }

  if (!state || !Array.isArray(state.teams) || state.teams.length === 0) {
    alert('Ingen quiz-data å eksportere.');
    return;
  }

  const roundCount = state.roundCount || 5;
  const roundNames = state.roundNames || [];
  const teams = state.teams || [];

  const workbook = XLSX.utils.book_new();

  // ==========================================
  // ARK 1: SAMMENLAGT RESULTATER
  // ==========================================
  const headers1 = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    headers1.push(roundNames[r] || `Runde ${r + 1}`);
  }
  headers1.push('Sammenlagt', 'Merknad / Tie-breaker');

  const rows1 = [headers1];

  teams.forEach((team, idx) => {
    const row = [];
    row.push(team.rank ? `${team.rank}. plass` : `${idx + 1}. plass`);
    row.push(team.name || `Lag ${idx + 1}`);

    for (let r = 0; r < roundCount; r++) {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      row.push(parsed !== null ? parsed : '');
    }

    const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
    row.push(total);
    row.push(team.tieBreakerNote || '');

    rows1.push(row);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(rows1);
  const colWidths1 = [{ wch: 14 }, { wch: 28 }];
  for (let r = 0; r < roundCount; r++) colWidths1.push({ wch: 12 });
  colWidths1.push({ wch: 16 }, { wch: 35 });
  ws1['!cols'] = colWidths1;

  XLSX.utils.book_append_sheet(workbook, ws1, 'Sammenlagt');

  // ==========================================
  // ARK 2: RUNDEVINNERE & STATISTIKK
  // ==========================================
  const roundWinners = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getRoundWinners(teams, roundCount, roundNames) 
    : [];
  const tally = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getTeamWinsTally(teams, roundWinners) 
    : [];

  const rows2 = [
    ['🏆 RUNDEVINNERE - BEST I HVER RUNDE'],
    ['Runde', 'Vinner(e) av runden', 'Beste poengsum', 'Gjennomsnittsscore', 'Laveste score']
  ];

  roundWinners.forEach(rw => {
    const winnerNames = rw.winners.map(w => w.name).join(', ') || 'Ingen poeng';
    rows2.push([
      rw.roundTitle,
      winnerNames,
      rw.hasScores ? rw.maxScore : '',
      rw.hasScores ? rw.avgScore : '',
      rw.hasScores ? rw.minScore : ''
    ]);
  });

  rows2.push([]);
  rows2.push(['🥇 FLEST RUNDESEIERE SAMMENLAGT']);
  rows2.push(['Lagnavn', 'Antall rundeseiere', 'Runder vunnet', 'Beste enkeltrunde']);

  tally.forEach(t => {
    rows2.push([
      t.name,
      t.wins,
      t.roundsWon.join(', ') || 'Ingen',
      t.bestScore > 0 ? t.bestScore : ''
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(rows2);
  ws2['!cols'] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(workbook, ws2, 'Rundevinnere');

  // ==========================================
  // ARK 3: RUNDEUVIKLING (KLARGJORT FOR LINJEDIAGRAM)
  // ==========================================
  const rows3 = [
    ['📈 POENGUTVIKLING RUNDE FOR RUNDE (KLARGJORT FOR LINJEDIAGRAM)'],
    ['(Merk tabellen nedenfor og velg "Sett inn" -> "Linjediagram" i Excel for å lage graf)'],
    []
  ];

  const chartHeaders = ['Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    chartHeaders.push(roundNames[r] || `Runde ${r + 1}`);
  }
  rows3.push(chartHeaders);

  const cumulativeData = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getCumulativeScores(teams, roundCount) 
    : [];

  cumulativeData.forEach(c => {
    const row = [c.name];
    c.cumulative.forEach(val => row.push(val));
    rows3.push(row);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(rows3);
  const colWidths3 = [{ wch: 28 }];
  for (let r = 0; r < roundCount; r++) colWidths3.push({ wch: 14 });
  ws3['!cols'] = colWidths3;

  XLSX.utils.book_append_sheet(workbook, ws3, 'Rundeutvikling (Grafdata)');

  // Generer og last ned filen
  const dateStr = state.date || new Date().toISOString().split('T')[0];
  const safeTitle = (state.title || 'Quiz').replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_');
  const filename = `${safeTitle}_${dateStr}_komplett.xlsx`;

  XLSX.writeFile(workbook, filename);
}

window.QuizExcelExport = {
  exportQuizToExcel
};
