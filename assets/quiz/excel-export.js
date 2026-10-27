/**
 * excel-export.js - Generering av ekte Microsoft Excel-arbeidsbøker (.xlsx)
 * Bruker lokalt pakket SheetJS (vendor/xlsx.full.min.js) for 100 % offline drift.
 * For Quiz Kraft (ranheimkraft.no)
 */

function exportQuizToExcel(state) {
  if (typeof XLSX === 'undefined') {
    alert('Feil: Excel-biblioteket (xlsx.full.min.js) ble ikke funnet. Sjekk at assets/quiz/xlsx.full.min.js er til stede.');
    return;
  }

  if (!state || !Array.isArray(state.teams)) {
    alert('Ingen quiz-data å eksportere.');
    return;
  }

  const roundCount = state.roundCount || 5;
  const roundNames = state.roundNames || [];

  // Bygg overskriftsrad
  const headers = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    headers.push(roundNames[r] || `Runde ${r + 1}`);
  }
  headers.push('Sammenlagt', 'Merknad / Tie-breaker');

  // Bygg datarekker
  const rows = [headers];

  state.teams.forEach((team, idx) => {
    const row = [];
    // Plassering
    row.push(team.rank ? `${team.rank}. plass` : `${idx + 1}. plass`);
    // Lagnavn
    row.push(team.name || `Lag ${idx + 1}`);

    // Runder (som ekte tall hvis utfylt, ellers tom streng)
    for (let r = 0; r < roundCount; r++) {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(team.scores[r]) : null;
      if (parsed !== null) {
        row.push(parsed);
      } else {
        row.push('');
      }
    }

    // Sammenlagt (som ekte tall)
    const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
    row.push(total);

    // Merknad
    row.push(team.tieBreakerNote || '');

    rows.push(row);
  });

  // Opprett SheetJS arbeidsbok
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Sett fornuftige kolonnebredder (ch)
  const colWidths = [
    { wch: 14 }, // Plassering
    { wch: 28 }, // Lagnavn
  ];
  for (let r = 0; r < roundCount; r++) {
    colWidths.push({ wch: 12 }); // Runder
  }
  colWidths.push({ wch: 16 }); // Sammenlagt
  colWidths.push({ wch: 35 }); // Merknad
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Resultater');

  // Generer filnavn
  const dateStr = state.date || new Date().toISOString().split('T')[0];
  const safeTitle = (state.title || 'Quiz').replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_');
  const filename = `${safeTitle}_${dateStr}.xlsx`;

  // Start nedlasting
  XLSX.writeFile(workbook, filename);
}

window.QuizExcelExport = {
  exportQuizToExcel
};
