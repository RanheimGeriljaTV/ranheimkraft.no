/**
 * excel-export.js - Generering av et helhetlig, stilrent og profesjonelt Excel-ark (.xlsx)
 * med fet skrift, tydelige kantlinjer, farger og samlet analyse i ett og samme ark.
 * Bruker lokalt pakket ExcelJS (assets/quiz/exceljs.min.js) for 100 % offline drift.
 * For Quiz Kraft (ranheimkraft.no)
 */

async function exportQuizToExcel(state) {
  if (typeof ExcelJS === 'undefined') {
    alert('Feil: ExcelJS-biblioteket (assets/quiz/exceljs.min.js) ble ikke funnet.');
    return;
  }

  if (!state || !Array.isArray(state.teams) || state.teams.length === 0) {
    alert('Ingen quiz-data å eksportere.');
    return;
  }

  const roundCount = state.roundCount || 5;
  const roundNames = state.roundNames || [];
  const teams = state.teams || [];
  const title = state.title || 'Ranheim Quiz';
  const dateStr = state.date || new Date().toISOString().split('T')[0];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quiz Kraft (ranheimkraft.no)';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Quiz Poengtavle', {
    views: [{ showGridLines: true }]
  });

  // Felles kantlinje-stil for alle celler
  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  const totalCols = 2 + roundCount + 2; // Rank, Navn, Runder..., Sammenlagt, Merknad

  // 1. TITTELRAD (Rad 1)
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `🏆 ${title.toUpperCase()} – OFFISIELL POENGTAVLE`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Marineblå
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 32;

  // 2. METADATARAD (Rad 2)
  sheet.mergeCells(2, 1, 2, totalCols);
  const metaCell = sheet.getCell(2, 1);
  metaCell.value = `Dato: ${dateStr}  |  Arrangert for ranheimkraft.no  |  Totalt ${teams.length} lag og ${roundCount} runder`;
  metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 18;

  // Tom rad 3
  sheet.getRow(3).height = 8;

  // 3. TABELL-OVERSKRIFTER (Rad 4)
  const headers = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    headers.push(roundNames[r] || `Runde ${r + 1}`);
  }
  headers.push('SAMMENLAGT', 'Merknad / Tie-breaker');

  const headerRow = sheet.getRow(4);
  headerRow.height = 24;

  headers.forEach((h, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Mørk skifergrå
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  // 4. DATARADER FOR LAGENE (Rad 5...)
  let currentRowIdx = 5;

  teams.forEach((team, tIdx) => {
    const row = sheet.getRow(currentRowIdx);
    row.height = 22;

    const rank = team.rank || (tIdx + 1);
    let rankText = `${rank}. plass`;
    if (rank === 1) rankText = `🥇 1. plass`;
    else if (rank === 2) rankText = `🥈 2. plass`;
    else if (rank === 3) rankText = `🥉 3. plass`;

    // Plassering (Kol 1)
    const cellRank = row.getCell(1);
    cellRank.value = rankText;
    cellRank.font = { name: 'Arial', size: 10, bold: rank <= 3 };
    cellRank.alignment = { horizontal: 'center', vertical: 'middle' };
    cellRank.border = thinBorder;

    // Lagnavn (Kol 2)
    const cellName = row.getCell(2);
    cellName.value = team.name || `Lag ${tIdx + 1}`;
    cellName.font = { name: 'Arial', size: 10, bold: rank <= 3 };
    cellName.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cellName.border = thinBorder;

    // Runder (Kol 3..N)
    for (let r = 0; r < roundCount; r++) {
      const cellScore = row.getCell(3 + r);
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      if (parsed !== null) {
        cellScore.value = parsed;
        cellScore.numFmt = '#,##0.0';
      } else {
        cellScore.value = '';
      }
      cellScore.font = { name: 'Arial', size: 10 };
      cellScore.alignment = { horizontal: 'center', vertical: 'middle' };
      cellScore.border = thinBorder;
    }

    // Sammenlagt sum (Kol 3 + roundCount)
    const totalColIdx = 3 + roundCount;
    const cellTotal = row.getCell(totalColIdx);
    const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
    cellTotal.value = total;
    cellTotal.numFmt = '#,##0.0';
    cellTotal.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    cellTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } }; // Gul fremheving
    cellTotal.alignment = { horizontal: 'center', vertical: 'middle' };
    cellTotal.border = thinBorder;

    // Merknad (Kol 3 + roundCount + 1)
    const noteColIdx = totalColIdx + 1;
    const cellNote = row.getCell(noteColIdx);
    cellNote.value = team.tieBreakerNote || '';
    cellNote.font = { name: 'Arial', size: 9, italic: true };
    cellNote.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cellNote.border = thinBorder;

    // Bakgrunnsfarge for topp 3 rader
    if (rank === 1) {
      applyRowFill(row, 'FFFEF9C3', [totalColIdx]); // Lys gull
    } else if (rank === 2) {
      applyRowFill(row, 'FFF1F5F9', [totalColIdx]); // Lys sølv
    } else if (rank === 3) {
      applyRowFill(row, 'FFFFEDD5', [totalColIdx]); // Lys bronse
    }

    currentRowIdx++;
  });

  // Hjelpefunksjon for å sette fyll på celler unntatt sammenlagt
  function applyRowFill(row, argbColor, excludeCols) {
    for (let c = 1; c <= totalCols; c++) {
      if (!excludeCols.includes(c)) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
      }
    }
  }

  // Tom rad før sammendrag
  sheet.getRow(currentRowIdx).height = 10;
  currentRowIdx++;

  // ============================================================
  // 5. RUNDESTATISTIKK & VINNERE I SAMME ARK (Direkte under tabellen)
  // ============================================================
  const roundWinners = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getRoundWinners(teams, roundCount, roundNames) 
    : [];

  // Rad A: Rundevinnere
  const winnerRow = sheet.getRow(currentRowIdx);
  winnerRow.height = 22;
  winnerRow.getCell(1).value = '🏆 Vinner(e)';
  winnerRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  winnerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  winnerRow.getCell(1).border = thinBorder;
  winnerRow.getCell(2).value = 'Beste lag i runden:';
  winnerRow.getCell(2).font = { name: 'Arial', size: 9, bold: true };
  winnerRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  winnerRow.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = winnerRow.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.winners.map(w => w.name).join(', ') : '-';
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0369A1' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    cell.border = thinBorder;
  }
  winnerRow.getCell(3 + roundCount).border = thinBorder;
  winnerRow.getCell(3 + roundCount + 1).border = thinBorder;
  currentRowIdx++;

  // Rad B: Beste poengsum
  const bestScoreRow = sheet.getRow(currentRowIdx);
  bestScoreRow.height = 20;
  bestScoreRow.getCell(1).value = 'Høyeste score';
  bestScoreRow.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  bestScoreRow.getCell(1).border = thinBorder;
  bestScoreRow.getCell(2).value = 'Poengsum til vinner:';
  bestScoreRow.getCell(2).font = { name: 'Arial', size: 9 };
  bestScoreRow.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = bestScoreRow.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.maxScore : '-';
    cell.font = { name: 'Arial', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }
  bestScoreRow.getCell(3 + roundCount).border = thinBorder;
  bestScoreRow.getCell(3 + roundCount + 1).border = thinBorder;
  currentRowIdx++;

  // Rad C: Gjennomsnitt
  const avgRow = sheet.getRow(currentRowIdx);
  avgRow.height = 20;
  avgRow.getCell(1).value = 'Snitt';
  avgRow.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  avgRow.getCell(1).border = thinBorder;
  avgRow.getCell(2).value = 'Gjennomsnitt for runden:';
  avgRow.getCell(2).font = { name: 'Arial', size: 9 };
  avgRow.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = avgRow.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.avgScore : '-';
    cell.font = { name: 'Arial', size: 9, italic: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }
  avgRow.getCell(3 + roundCount).border = thinBorder;
  avgRow.getCell(3 + roundCount + 1).border = thinBorder;
  currentRowIdx++;

  // Rad D: Laveste score
  const minRow = sheet.getRow(currentRowIdx);
  minRow.height = 20;
  minRow.getCell(1).value = 'Laveste score';
  minRow.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  minRow.getCell(1).border = thinBorder;
  minRow.getCell(2).value = 'Bunnscore i runden:';
  minRow.getCell(2).font = { name: 'Arial', size: 9 };
  minRow.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = minRow.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.minScore : '-';
    cell.font = { name: 'Arial', size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }
  minRow.getCell(3 + roundCount).border = thinBorder;
  minRow.getCell(3 + roundCount + 1).border = thinBorder;
  currentRowIdx++;

  // 6. KOLONNEBREDDER
  sheet.getColumn(1).width = 14; // Plassering
  sheet.getColumn(2).width = 28; // Lagnavn
  for (let r = 0; r < roundCount; r++) {
    sheet.getColumn(3 + r).width = 13; // Runder
  }
  sheet.getColumn(3 + roundCount).width = 16; // Sammenlagt
  sheet.getColumn(3 + roundCount + 1).width = 34; // Merknad

  // GENERER BUFFER OG LAST NED
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const safeTitle = (title || 'Quiz').replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_');
  const filename = `${safeTitle}_${dateStr}.xlsx`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.QuizExcelExport = {
  exportQuizToExcel
};
