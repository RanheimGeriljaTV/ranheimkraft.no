/**
 * excel-export.js - Generering av et helhetlig, stilrent og profesjonelt Excel-ark (.xlsx)
 * med fet skrift, kantlinjer, farger på rundevinnere, og RUNDE FOR RUNDE MED ALLE LAGS SUMMER (akkumulert stilling).
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
  const allTeams = state.teams || [];
  // Aktive lag som deltar i kveld
  const activeTeams = allTeams.filter(t => t.active !== false);
  const inactiveTeams = allTeams.filter(t => t.active === false);
  const title = state.title || 'Ranheim Quiz';
  const dateStr = state.date || new Date().toISOString().split('T')[0];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quiz Kraft (ranheimkraft.no)';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Quiz Resultatliste', {
    views: [{ showGridLines: true }]
  });

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  const totalCols = Math.max(6, 2 + roundCount + 2);

  // 1. TITTELRAD (Rad 1)
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `🏆 ${title.toUpperCase()} – OFFISIELL RESULTATLISTE & POENGTAVLE`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 34;

  // 2. METADATARAD (Rad 2)
  sheet.mergeCells(2, 1, 2, totalCols);
  const metaCell = sheet.getCell(2, 1);
  metaCell.value = `Dato: ${dateStr}  |  ranheimkraft.no  |  ${activeTeams.length} deltakende lag  |  ${roundCount} runder`;
  metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 18;

  // Tom rad 3
  sheet.getRow(3).height = 8;

  // Beregn rundevinnere for aktive lag
  const roundMaxScores = [];
  for (let r = 0; r < roundCount; r++) {
    let max = -Infinity;
    activeTeams.forEach(t => {
      const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      if (val !== null && val > max) max = val;
    });
    roundMaxScores.push(max > 0 ? max : null);
  }

  // ==========================================
  // SEKSJON 1: HOVEDTABELL (POENG PER RUNDE)
  // ==========================================
  const headers = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    headers.push(roundNames[r] || `Runde ${r + 1}`);
  }
  headers.push('SAMMENLAGT', 'Merknad / Tie-breaker');

  const headerRow = sheet.getRow(4);
  headerRow.height = 25;

  headers.forEach((h, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  let currentRowIdx = 5;

  activeTeams.forEach((team, tIdx) => {
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
      const isWinner = roundMaxScores[r] !== null && parsed !== null && parsed === roundMaxScores[r];

      if (parsed !== null) {
        cellScore.value = parsed;
        cellScore.numFmt = '#,##0.0';
      } else {
        cellScore.value = '';
      }

      cellScore.font = { name: 'Arial', size: 10, bold: isWinner, color: isWinner ? { argb: 'FF15803D' } : undefined };
      cellScore.alignment = { horizontal: 'center', vertical: 'middle' };
      cellScore.border = thinBorder;

      if (isWinner) {
        cellScore.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Myk grønn rundevinner
      }
    }

    // Sammenlagt (Kol 3 + roundCount)
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

    // Topp 3 utheving (bortsett fra vinnerceller og sammenlagt)
    if (rank === 1) {
      applyRowFillSelective(row, 'FFFEF9C3', roundCount, roundMaxScores, team);
    } else if (rank === 2) {
      applyRowFillSelective(row, 'FFF1F5F9', roundCount, roundMaxScores, team);
    } else if (rank === 3) {
      applyRowFillSelective(row, 'FFFFEDD5', roundCount, roundMaxScores, team);
    }

    currentRowIdx++;
  });

  function applyRowFillSelective(row, argbColor, rCount, maxScores, team) {
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
    for (let r = 0; r < rCount; r++) {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      const isWinner = maxScores[r] !== null && parsed !== null && parsed === maxScores[r];
      if (!isWinner) {
        row.getCell(3 + r).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
      }
    }
    row.getCell(3 + rCount + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
  }

  // Hvis det finnes inaktive lag i banken:
  if (inactiveTeams.length > 0) {
    inactiveTeams.forEach((team) => {
      const row = sheet.getRow(currentRowIdx);
      row.height = 20;

      const cellRank = row.getCell(1);
      cellRank.value = '-';
      cellRank.font = { name: 'Arial', size: 9, color: { argb: 'FF94A3B8' } };
      cellRank.alignment = { horizontal: 'center', vertical: 'middle' };
      cellRank.border = thinBorder;

      const cellName = row.getCell(2);
      cellName.value = `${team.name || 'Lag'} (Deltok ikke)`;
      cellName.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
      cellName.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cellName.border = thinBorder;

      for (let r = 0; r < roundCount; r++) {
        const cell = row.getCell(3 + r);
        cell.value = '';
        cell.border = thinBorder;
      }

      const cellTotal = row.getCell(3 + roundCount);
      cellTotal.value = '-';
      cellTotal.alignment = { horizontal: 'center', vertical: 'middle' };
      cellTotal.border = thinBorder;

      const cellNote = row.getCell(3 + roundCount + 1);
      cellNote.value = 'Ikke til stede';
      cellNote.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
      cellNote.border = thinBorder;

      currentRowIdx++;
    });
  }

  // Oppsummering under tabell 1
  const roundWinners = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getRoundWinners(activeTeams, roundCount, roundNames) 
    : [];

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

  // Høyeste score
  const bestScoreRow = sheet.getRow(currentRowIdx);
  bestScoreRow.height = 20;
  bestScoreRow.getCell(1).value = 'Beste score';
  bestScoreRow.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  bestScoreRow.getCell(1).border = thinBorder;
  bestScoreRow.getCell(2).value = 'Høyeste poengsum:';
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

  // Gjennomsnitt
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

  // =========================================================================
  // SEKSJON 2: STILLING & SAMMENLAGT POENGSUM ETTER HVER RUNDE (AKKUMULERT)
  // "hvor er runde for runde med alle lags summer ?" -> HER!
  // =========================================================================
  currentRowIdx += 2; // 2 blanke linjer

  // Tittel for seksjon 2
  sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalCols);
  const sec2TitleCell = sheet.getCell(currentRowIdx, 1);
  sec2TitleCell.value = '📈 STILLING & SAMMENLAGT POENGSUM ETTER HVER RUNDE';
  sec2TitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  sec2TitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dyp teal
  sec2TitleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sheet.getRow(currentRowIdx).height = 26;
  currentRowIdx++;

  sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalCols);
  const sec2SubCell = sheet.getCell(currentRowIdx, 1);
  sec2SubCell.value = 'Viser den akkumulerte poengsummen til hvert lag etter runde 1, runde 2, runde 3 osv.';
  sec2SubCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
  sec2SubCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  sec2SubCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sheet.getRow(currentRowIdx).height = 18;
  currentRowIdx++;

  // Headers for seksjon 2
  const sec2Headers = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    sec2Headers.push(`Etter ${roundNames[r] || 'Runde ' + (r + 1)}`);
  }
  sec2Headers.push('SLUTTSUM', 'Status');

  const sec2HeaderRow = sheet.getRow(currentRowIdx);
  sec2HeaderRow.height = 24;
  sec2Headers.forEach((h, colIdx) => {
    const cell = sec2HeaderRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134E4A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  currentRowIdx++;

  // Finn leder etter hver runde (høyeste akkumulerte sum)
  const roundLeaders = [];
  for (let r = 0; r < roundCount; r++) {
    let maxCum = -Infinity;
    activeTeams.forEach(t => {
      let cum = 0;
      let hasAny = false;
      for (let i = 0; i <= r; i++) {
        const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[i] : null) : null;
        if (val !== null) { cum += val; hasAny = true; }
      }
      if (hasAny && cum > maxCum) maxCum = cum;
    });
    roundLeaders.push(maxCum > 0 ? maxCum : null);
  }

  // Datarader for seksjon 2 (akkumulerte poengsummer)
  activeTeams.forEach((team, tIdx) => {
    const row = sheet.getRow(currentRowIdx);
    row.height = 21;
    const rank = team.rank || (tIdx + 1);

    const cellRank = row.getCell(1);
    cellRank.value = `${rank}.`;
    cellRank.font = { name: 'Arial', size: 10, bold: rank <= 3 };
    cellRank.alignment = { horizontal: 'center', vertical: 'middle' };
    cellRank.border = thinBorder;

    const cellName = row.getCell(2);
    cellName.value = team.name || `Lag ${tIdx + 1}`;
    cellName.font = { name: 'Arial', size: 10, bold: rank <= 3 };
    cellName.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cellName.border = thinBorder;

    let runningSum = 0;
    let hasAnyScore = false;

    for (let r = 0; r < roundCount; r++) {
      const cell = row.getCell(3 + r);
      const val = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      if (val !== null) {
        runningSum += val;
        hasAnyScore = true;
      }

      if (hasAnyScore) {
        cell.value = runningSum;
        cell.numFmt = '#,##0.0';
      } else {
        cell.value = '-';
      }

      const isLeader = hasAnyScore && roundLeaders[r] !== null && runningSum === roundLeaders[r];
      cell.font = { name: 'Arial', size: 10, bold: isLeader };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;

      if (isLeader) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } }; // Myk mintleder
      }
    }

    const finalTotal = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
    const cellTotal = row.getCell(3 + roundCount);
    cellTotal.value = finalTotal;
    cellTotal.numFmt = '#,##0.0';
    cellTotal.font = { name: 'Arial', size: 10, bold: true };
    cellTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    cellTotal.alignment = { horizontal: 'center', vertical: 'middle' };
    cellTotal.border = thinBorder;

    const cellStatus = row.getCell(3 + roundCount + 1);
    cellStatus.value = rank === 1 ? '🏆 Vinner' : (rank <= 3 ? 'På pallen' : '');
    cellStatus.font = { name: 'Arial', size: 9, italic: true };
    cellStatus.alignment = { horizontal: 'center', vertical: 'middle' };
    cellStatus.border = thinBorder;

    currentRowIdx++;
  });

  // =========================================================================
  // SEKSJON 3: MESTVINNENDE LAG (RUNDESEIERE)
  // =========================================================================
  const tally = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getTeamWinsTally(activeTeams, roundWinners) 
    : [];

  if (tally.length > 0) {
    currentRowIdx += 2; // 2 blanke linjer

    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalCols);
    const sec3Title = sheet.getCell(currentRowIdx, 1);
    sec3Title.value = '🥇 MESTVINNENDE LAG (Flest rundeseiere)';
    sec3Title.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    sec3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF78350F' } }; // Varm bronse/rav
    sec3Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sheet.getRow(currentRowIdx).height = 24;
    currentRowIdx++;

    const sec3Headers = ['#', 'Lagnavn', 'Antall rundeseiere', 'Beste score'];
    const sec3HeaderRow = sheet.getRow(currentRowIdx);
    sec3HeaderRow.height = 22;
    sec3Headers.forEach((h, colIdx) => {
      const cell = sec3HeaderRow.getCell(colIdx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
      cell.alignment = { horizontal: colIdx === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });
    currentRowIdx++;

    tally.slice(0, 10).forEach((t, idx) => {
      const row = sheet.getRow(currentRowIdx);
      row.height = 20;

      const cellRank = row.getCell(1);
      cellRank.value = idx === 0 && t.wins > 0 ? '🏆 1.' : `${idx + 1}.`;
      cellRank.font = { name: 'Arial', size: 9, bold: idx === 0 };
      cellRank.alignment = { horizontal: 'center', vertical: 'middle' };
      cellRank.border = thinBorder;

      const cellName = row.getCell(2);
      cellName.value = t.name;
      cellName.font = { name: 'Arial', size: 9, bold: idx === 0 };
      cellName.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cellName.border = thinBorder;

      const cellWins = row.getCell(3);
      cellWins.value = `${t.wins} seier${t.wins === 1 ? '' : 'e'}`;
      cellWins.font = { name: 'Arial', size: 9, bold: t.wins > 0 };
      cellWins.alignment = { horizontal: 'center', vertical: 'middle' };
      cellWins.border = thinBorder;

      const cellBest = row.getCell(4);
      cellBest.value = t.bestScore > 0 ? t.bestScore : '-';
      cellBest.font = { name: 'Arial', size: 9 };
      cellBest.alignment = { horizontal: 'center', vertical: 'middle' };
      cellBest.border = thinBorder;

      currentRowIdx++;
    });
  }

  // Kolonnebredder
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 28;
  for (let r = 0; r < roundCount; r++) {
    sheet.getColumn(3 + r).width = 15;
  }
  sheet.getColumn(3 + roundCount).width = 16;
  sheet.getColumn(3 + roundCount + 1).width = 30;

  // GENERER OG LAST NED
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const safeTitle = (title || 'Quiz').replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_');
  const filename = `${safeTitle}_${dateStr}_resultater.xlsx`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.QuizExcelExport = {
  exportQuizToExcel,
  exportToExcel: exportQuizToExcel
};
