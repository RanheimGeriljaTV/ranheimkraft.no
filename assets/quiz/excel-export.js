/**
 * excel-export.js - Generering av komplett profesjonelt Excel-ark (.xlsx)
 * med EGNE DEDIKERTE ARK FOR HVER ENKELT RUNDE:
 * - Ark "Sammenlagt": Hovedpoengtavle og offisiell resultatliste
 * - Ark "Runde 1": Alle lags poengsum i Runde 1, sortert fra best til dårligst, med statistikk og beste score
 * - Ark "Runde 2": Alle lags poengsum i Runde 2, sortert fra best til dårligst, med statistikk og beste score
 * - Ark "Runde 3", "Runde 4" osv. for samtlige spilte runder
 * - Ark "Akkumulert stilling": Sammenlagt poengsum etter hver enkelt runde
 * - Ark "Mestvinnende": Ledertavle over hvem som vant flest runder
 * 
 * 100 % frakoblet via lokalt pakket ExcelJS (assets/quiz/exceljs.min.js).
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
  const activeTeams = allTeams.filter(t => t.active !== false);
  const inactiveTeams = allTeams.filter(t => t.active === false);
  const title = state.title || 'Ranheim Quiz';
  const dateStr = state.date || new Date().toISOString().split('T')[0];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quiz Kraft (ranheimkraft.no)';
  workbook.created = new Date();

  // Sørg for at fanelinjen (sheet tabs) alltid er synlig nederst i Microsoft Excel
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 0,
      visibility: 'visible'
    }
  ];

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  // Beregn rundevinnere, laveste score og statistikk
  const roundMaxScores = [];
  const roundMinScores = [];
  for (let r = 0; r < roundCount; r++) {
    let max = -Infinity;
    let min = Infinity;
    let count = 0;
    activeTeams.forEach(t => {
      const val = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      if (val !== null) {
        count++;
        if (val > max) max = val;
        if (val < min) min = val;
      }
    });
    roundMaxScores.push(max > 0 ? max : null);
    // Uthev dårligste score bare hvis det er minst 2 distinkte poengsummer i runden
    roundMinScores.push(count > 1 && min < max ? min : null);
  }

  const roundWinners = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getRoundWinners(activeTeams, roundCount, roundNames) 
    : [];

  // =========================================================================
  // ARK 1: SAMMENLAGT (OFFISIELL RESULTATLISTE)
  // =========================================================================
  const sheetMain = workbook.addWorksheet('Sammenlagt', {
    views: [{ showGridLines: true }]
  });

  const totalCols1 = Math.max(6, 2 + roundCount + 2);

  // Tittelrad
  sheetMain.mergeCells(1, 1, 1, totalCols1);
  const t1 = sheetMain.getCell(1, 1);
  t1.value = `🏆 ${title.toUpperCase()} – OFFISIELL RESULTATLISTE`;
  t1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  t1.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetMain.getRow(1).height = 34;

  // Metadata, fargeforklaring & Tips
  sheetMain.mergeCells(2, 1, 2, totalCols1);
  const m1 = sheetMain.getCell(2, 1);
  m1.value = `Dato: ${dateStr}  |  ranheimkraft.no  |  ${activeTeams.length} deltakende lag  |  🟢 Grønn = Rundevinner  |  🔴 Rød = Laveste score  |  💡 Tips: Klikk på fanene nederst for egne ark per runde!`;
  m1.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
  m1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  m1.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetMain.getRow(2).height = 20;

  sheetMain.getRow(3).height = 8;

  // Tabell-overskrifter
  const h1 = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    h1.push(roundNames[r] || `Runde ${r + 1}`);
  }
  h1.push('SAMMENLAGT', 'Merknad / Tie-breaker');

  const h1Row = sheetMain.getRow(4);
  h1Row.height = 25;
  h1.forEach((h, colIdx) => {
    const cell = h1Row.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  let rowIdx1 = 5;
  activeTeams.forEach((team, tIdx) => {
    const row = sheetMain.getRow(rowIdx1);
    row.height = 22;
    const rank = team.rank || (tIdx + 1);

    let rankText = `${rank}. plass`;
    if (rank === 1) rankText = `🥇 1. plass`;
    else if (rank === 2) rankText = `🥈 2. plass`;
    else if (rank === 3) rankText = `🥉 3. plass`;

    const cellRank = row.getCell(1);
    cellRank.value = rankText;
    cellRank.font = { name: 'Arial', size: 10, bold: rank <= 3 };
    cellRank.alignment = { horizontal: 'center', vertical: 'middle' };
    cellRank.border = thinBorder;

    const cellName = row.getCell(2);
    cellName.value = team.name || `Lag ${tIdx + 1}`;
    cellName.font = { name: 'Arial', size: 10, bold: rank <= 3 };
    cellName.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cellName.border = thinBorder;

    for (let r = 0; r < roundCount; r++) {
      const cellScore = row.getCell(3 + r);
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      const isWinner = roundMaxScores[r] !== null && parsed !== null && parsed === roundMaxScores[r];
      const isLowest = roundMinScores[r] !== null && parsed !== null && parsed === roundMinScores[r];

      if (parsed !== null) {
        cellScore.value = parsed;
        cellScore.numFmt = '#,##0.0';
      } else {
        cellScore.value = '';
      }

      if (isWinner) {
        cellScore.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } };
        cellScore.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      } else if (isLowest) {
        cellScore.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF991B1B' } };
        cellScore.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      } else {
        cellScore.font = { name: 'Arial', size: 10 };
      }
      cellScore.alignment = { horizontal: 'center', vertical: 'middle' };
      cellScore.border = thinBorder;
    }

    const totalColIdx = 3 + roundCount;
    const cellTotal = row.getCell(totalColIdx);
    const total = window.QuizScoring ? window.QuizScoring.calculateTeamTotal(team, roundCount) : 0;
    cellTotal.value = total;
    cellTotal.numFmt = '#,##0.0';
    cellTotal.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    cellTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    cellTotal.alignment = { horizontal: 'center', vertical: 'middle' };
    cellTotal.border = thinBorder;

    const cellNote = row.getCell(totalColIdx + 1);
    cellNote.value = team.tieBreakerNote || '';
    cellNote.font = { name: 'Arial', size: 9, italic: true };
    cellNote.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cellNote.border = thinBorder;

    if (rank === 1) applyPallFill(row, 'FFFEF9C3', roundCount, roundMaxScores, roundMinScores, team);
    else if (rank === 2) applyPallFill(row, 'FFF1F5F9', roundCount, roundMaxScores, roundMinScores, team);
    else if (rank === 3) applyPallFill(row, 'FFFFEDD5', roundCount, roundMaxScores, roundMinScores, team);

    rowIdx1++;
  });

  function applyPallFill(row, colorHex, rCount, maxScores, minScores, team) {
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHex } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHex } };
    for (let r = 0; r < rCount; r++) {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(team.scores ? team.scores[r] : null) : null;
      const isWinner = maxScores[r] !== null && parsed !== null && parsed === maxScores[r];
      const isLowest = minScores[r] !== null && parsed !== null && parsed === minScores[r];
      if (!isWinner && !isLowest) {
        row.getCell(3 + r).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHex } };
      }
    }
    row.getCell(3 + rCount + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHex } };
  }

  // Inaktive lag
  if (inactiveTeams.length > 0) {
    inactiveTeams.forEach((team) => {
      const row = sheetMain.getRow(rowIdx1);
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

      rowIdx1++;
    });
  }

  // Oppsummeringsrader under tabell 1
  const winnerRow1 = sheetMain.getRow(rowIdx1);
  winnerRow1.height = 22;
  winnerRow1.getCell(1).value = '🏆 Vinner(e)';
  winnerRow1.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  winnerRow1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  winnerRow1.getCell(1).border = thinBorder;
  winnerRow1.getCell(2).value = 'Beste lag i runden:';
  winnerRow1.getCell(2).font = { name: 'Arial', size: 9, bold: true };
  winnerRow1.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  winnerRow1.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = winnerRow1.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.winners.map(w => w.name).join(', ') : '-';
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0369A1' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    cell.border = thinBorder;
  }
  winnerRow1.getCell(3 + roundCount).border = thinBorder;
  winnerRow1.getCell(3 + roundCount + 1).border = thinBorder;
  rowIdx1++;

  const bestRow1 = sheetMain.getRow(rowIdx1);
  bestRow1.height = 20;
  bestRow1.getCell(1).value = 'Beste score';
  bestRow1.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  bestRow1.getCell(1).border = thinBorder;
  bestRow1.getCell(2).value = 'Høyeste poengsum:';
  bestRow1.getCell(2).font = { name: 'Arial', size: 9 };
  bestRow1.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = bestRow1.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.maxScore : '-';
    cell.font = { name: 'Arial', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }
  bestRow1.getCell(3 + roundCount).border = thinBorder;
  bestRow1.getCell(3 + roundCount + 1).border = thinBorder;
  rowIdx1++;

  const avgRow1 = sheetMain.getRow(rowIdx1);
  avgRow1.height = 20;
  avgRow1.getCell(1).value = 'Snitt';
  avgRow1.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  avgRow1.getCell(1).border = thinBorder;
  avgRow1.getCell(2).value = 'Gjennomsnitt for runden:';
  avgRow1.getCell(2).font = { name: 'Arial', size: 9 };
  avgRow1.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = avgRow1.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.avgScore : '-';
    cell.font = { name: 'Arial', size: 9, italic: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }
  avgRow1.getCell(3 + roundCount).border = thinBorder;
  avgRow1.getCell(3 + roundCount + 1).border = thinBorder;
  rowIdx1++;

  const lowestRow1 = sheetMain.getRow(rowIdx1);
  lowestRow1.height = 20;
  lowestRow1.getCell(1).value = 'Laveste score';
  lowestRow1.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  lowestRow1.getCell(1).border = thinBorder;
  lowestRow1.getCell(2).value = 'Laveste poengsum:';
  lowestRow1.getCell(2).font = { name: 'Arial', size: 9 };
  lowestRow1.getCell(2).border = thinBorder;

  for (let r = 0; r < roundCount; r++) {
    const rw = roundWinners[r];
    const cell = lowestRow1.getCell(3 + r);
    cell.value = rw && rw.hasScores ? rw.minScore : '-';
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF991B1B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    cell.border = thinBorder;
  }
  lowestRow1.getCell(3 + roundCount).border = thinBorder;
  lowestRow1.getCell(3 + roundCount + 1).border = thinBorder;

  sheetMain.getColumn(1).width = 14;
  sheetMain.getColumn(2).width = 28;
  for (let r = 0; r < roundCount; r++) {
    sheetMain.getColumn(3 + r).width = 14;
  }
  sheetMain.getColumn(3 + roundCount).width = 16;
  sheetMain.getColumn(3 + roundCount + 1).width = 26;

  // =========================================================================
  // EGNE DEDIKERTE ARK FOR HVER ENKELT RUNDE: "Runde 1", "Runde 2", osv.
  // "jeg vil ha RUNDE 1: ALLE LAGS POENGSUM sortert, RUNDE 2 det samme osv.
  //  bare statistikk med høyeste poengsum PR RUNDE!"
  // =========================================================================
  for (let r = 0; r < roundCount; r++) {
    const roundTitle = roundNames[r] || `Runde ${r + 1}`;
    const sheetName = `Runde ${r + 1}`;
    const maxScoreInR = roundMaxScores[r];
    const minScoreInR = roundMinScores[r];
    const rw = roundWinners[r];

    const roundSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }]
    });

    // 1. Tittelrad
    roundSheet.mergeCells(1, 1, 1, 5);
    const rTitleCell = roundSheet.getCell(1, 1);
    rTitleCell.value = `🎯 ${title.toUpperCase()} – RUNDE ${r + 1}: ${roundTitle.toUpperCase()}`;
    rTitleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    rTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Dyp skogsgrønn
    rTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    roundSheet.getRow(1).height = 34;

    // 2. Metadata & Statistikk forhåndsvisning
    roundSheet.mergeCells(2, 1, 2, 5);
    const rMetaCell = roundSheet.getCell(2, 1);
    const winnerNames = rw && rw.hasScores ? rw.winners.map(w => w.name).join(', ') : 'Ingen';
    const topScoreText = rw && rw.hasScores ? `${rw.maxScore} poeng` : '-';
    const avgScoreText = rw && rw.hasScores ? `${rw.avgScore} poeng` : '-';
    rMetaCell.value = `Dato: ${dateStr}  |  Høyeste poengsum: ${topScoreText} (${winnerNames})  |  Snitt: ${avgScoreText}`;
    rMetaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
    rMetaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    rMetaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    roundSheet.getRow(2).height = 20;

    roundSheet.getRow(3).height = 8;

    // 3. Tabelloverskrifter
    const roundHeaders = [
      'Plassering i runden',
      'Lagnavn',
      `Poengsum (${roundTitle})`,
      'Differanse fra beste',
      'Status'
    ];

    const rHRow = roundSheet.getRow(4);
    rHRow.height = 25;
    roundHeaders.forEach((th, cIdx) => {
      const cell = rHRow.getCell(cIdx + 1);
      cell.value = th;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });

    // 4. Sorter ALLE aktive lag etter poengsum i AKKURAT DENNE RUNDEN (synkende)!
    const sortedRoundTeams = activeTeams.map(t => {
      const parsed = window.QuizScoring ? window.QuizScoring.parseScore(t.scores ? t.scores[r] : null) : null;
      return {
        name: t.name || 'Lag',
        score: parsed
      };
    }).sort((a, b) => {
      const valA = a.score !== null ? a.score : -1;
      const valB = b.score !== null ? b.score : -1;
      return valB - valA;
    });

    let rDataIdx = 5;
    sortedRoundTeams.forEach((tData, pos) => {
      const row = roundSheet.getRow(rDataIdx);
      row.height = 22;

      const isWinner = maxScoreInR !== null && tData.score !== null && tData.score === maxScoreInR;
      const isLowest = minScoreInR !== null && tData.score !== null && tData.score === minScoreInR;

      // Plassering i runden
      const cellPos = row.getCell(1);
      let posText = `${pos + 1}. plass`;
      if (isWinner) posText = `🥇 1. plass`;
      else if (pos === 1) posText = `🥈 2. plass`;
      else if (pos === 2) posText = `🥉 3. plass`;

      cellPos.value = posText;
      cellPos.font = { name: 'Arial', size: 10, bold: pos < 3 || isWinner || isLowest };
      cellPos.alignment = { horizontal: 'center', vertical: 'middle' };
      cellPos.border = thinBorder;

      // Lagnavn
      const cellName = row.getCell(2);
      cellName.value = tData.name;
      cellName.font = { name: 'Arial', size: 10, bold: pos < 3 || isWinner || isLowest };
      cellName.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cellName.border = thinBorder;

      // Poengsum i runden
      const cellScore = row.getCell(3);
      if (tData.score !== null) {
        cellScore.value = tData.score;
        cellScore.numFmt = '#,##0.0';
      } else {
        cellScore.value = '-';
      }
      cellScore.font = { 
        name: 'Arial', 
        size: 11, 
        bold: true, 
        color: isWinner 
          ? { argb: 'FF15803D' } 
          : (isLowest ? { argb: 'FF991B1B' } : { argb: 'FF000000' })
      };
      cellScore.alignment = { horizontal: 'center', vertical: 'middle' };
      cellScore.border = thinBorder;

      // Differanse fra beste score
      const cellDiff = row.getCell(4);
      if (maxScoreInR !== null && tData.score !== null) {
        const diff = tData.score - maxScoreInR;
        cellDiff.value = diff === 0 ? 'Høyest (0)' : `${diff.toFixed(1).replace('.', ',')} p`;
      } else {
        cellDiff.value = '-';
      }
      cellDiff.font = { name: 'Arial', size: 9, italic: true };
      cellDiff.alignment = { horizontal: 'center', vertical: 'middle' };
      cellDiff.border = thinBorder;

      // Status
      const cellStatus = row.getCell(5);
      cellStatus.value = isWinner ? '🏆 Rundevinner' : (isLowest ? '🔻 Laveste score' : '');
      cellStatus.font = { 
        name: 'Arial', 
        size: 9, 
        bold: isWinner || isLowest, 
        color: isWinner ? { argb: 'FF15803D' } : (isLowest ? { argb: 'FF991B1B' } : undefined) 
      };
      cellStatus.alignment = { horizontal: 'center', vertical: 'middle' };
      cellStatus.border = thinBorder;

      // Fremhev vinnerlag i mykt grønt, laveste score i mykt rødt
      if (isWinner) {
        for (let c = 1; c <= 5; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        }
      } else if (isLowest) {
        for (let c = 1; c <= 5; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      } else if (pos === 1) {
        for (let c = 1; c <= 5; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }

      rDataIdx++;
    });

    // 5. Statistikkboks under tabellen for runden
    rDataIdx++; // 1 blank linje
    const statBoxHeader = roundSheet.getRow(rDataIdx);
    statBoxHeader.height = 22;
    statBoxHeader.getCell(1).value = `📊 RUNDESTATISTIKK FOR ${roundTitle.toUpperCase()}`;
    statBoxHeader.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    statBoxHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    statBoxHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    roundSheet.mergeCells(rDataIdx, 1, rDataIdx, 3);
    rDataIdx++;

    const statsList = [
      ['🏆 Høyeste poengsum i runden:', rw && rw.hasScores ? `${rw.maxScore} poeng (Vinner: ${winnerNames})` : '-'],
      ['📈 Gjennomsnittlig poengsum:', rw && rw.hasScores ? `${rw.avgScore} poeng` : '-'],
      ['📉 Laveste poengsum i runden:', rw && rw.hasScores ? `${rw.minScore} poeng` : '-'],
      ['👥 Antall deltakende lag:', `${activeTeams.length} lag`]
    ];

    statsList.forEach(([lbl, val]) => {
      const sRow = roundSheet.getRow(rDataIdx);
      sRow.height = 20;

      const isMinRow = lbl.includes('Laveste');

      const c1 = sRow.getCell(1);
      c1.value = lbl;
      c1.font = { name: 'Arial', size: 9, bold: true, color: isMinRow ? { argb: 'FF991B1B' } : undefined };
      c1.border = thinBorder;
      c1.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: isMinRow ? { argb: 'FFFEE2E2' } : { argb: 'FFF3F4F6' } 
      };

      const c2 = sRow.getCell(2);
      c2.value = val;
      c2.font = { name: 'Arial', size: 9, bold: isMinRow, color: isMinRow ? { argb: 'FF991B1B' } : undefined };
      c2.border = thinBorder;
      if (isMinRow) {
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      }
      roundSheet.mergeCells(rDataIdx, 2, rDataIdx, 3);

      rDataIdx++;
    });

    roundSheet.getColumn(1).width = 18;
    roundSheet.getColumn(2).width = 28;
    roundSheet.getColumn(3).width = 20;
    roundSheet.getColumn(4).width = 20;
    roundSheet.getColumn(5).width = 18;
  }

  // =========================================================================
  // ARK: AKKUMULERT STILLING (STILLING ETTER HVER RUNDE)
  // =========================================================================
  const sheetCum = workbook.addWorksheet('Akkumulert stilling', {
    views: [{ showGridLines: true }]
  });

  const totalColsCum = 2 + roundCount + 2;

  sheetCum.mergeCells(1, 1, 1, totalColsCum);
  const tCum = sheetCum.getCell(1, 1);
  tCum.value = '📈 STILLING & SAMMENLAGT POENGSUM ETTER HVER RUNDE';
  tCum.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  tCum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  tCum.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetCum.getRow(1).height = 32;

  sheetCum.mergeCells(2, 1, 2, totalColsCum);
  const mCum = sheetCum.getCell(2, 1);
  mCum.value = `Viser den akkumulerte poengsummen til hvert lag sammenlagt etter runde 1, runde 2, runde 3 osv.`;
  mCum.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
  mCum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  mCum.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetCum.getRow(2).height = 18;

  const hCum = ['Plassering', 'Lagnavn'];
  for (let r = 0; r < roundCount; r++) {
    hCum.push(`Etter ${roundNames[r] || 'Runde ' + (r + 1)}`);
  }
  hCum.push('SLUTTSUM', 'Status');

  const hCumRow = sheetCum.getRow(4);
  hCumRow.height = 24;
  hCum.forEach((h, colIdx) => {
    const cell = hCumRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134E4A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

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

  let rowIdxCum = 5;
  activeTeams.forEach((team, tIdx) => {
    const row = sheetCum.getRow(rowIdxCum);
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
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
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

    rowIdxCum++;
  });

  sheetCum.getColumn(1).width = 14;
  sheetCum.getColumn(2).width = 28;
  for (let r = 0; r < roundCount; r++) {
    sheetCum.getColumn(3 + r).width = 16;
  }
  sheetCum.getColumn(3 + roundCount).width = 16;
  sheetCum.getColumn(3 + roundCount + 1).width = 20;

  // =========================================================================
  // ARK: MESTVINNENDE LAG & STATISTIKK
  // =========================================================================
  const sheetStats = workbook.addWorksheet('Mestvinnende', {
    views: [{ showGridLines: true }]
  });

  sheetStats.mergeCells(1, 1, 1, 5);
  const tStats = sheetStats.getCell(1, 1);
  tStats.value = '🥇 MESTVINNENDE LAG & RUNDESTATISTIKK';
  tStats.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  tStats.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF78350F' } };
  tStats.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetStats.getRow(1).height = 32;

  const tally = window.QuizRoundAnalysis 
    ? window.QuizRoundAnalysis.getTeamWinsTally(activeTeams, roundWinners) 
    : [];

  sheetStats.mergeCells(3, 1, 3, 5);
  const secTally = sheetStats.getCell(3, 1);
  secTally.value = '🥇 Lagene med flest rundeseiere:';
  secTally.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF78350F' } };
  sheetStats.getRow(3).height = 20;

  const hTally = ['Rangering', 'Lagnavn', 'Antall rundeseiere', 'Beste rundescore', 'Status'];
  const hTallyRow = sheetStats.getRow(4);
  hTallyRow.height = 22;
  hTally.forEach((th, cIdx) => {
    const cell = hTallyRow.getCell(cIdx + 1);
    cell.value = th;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
    cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  let rowIdxStats = 5;
  tally.forEach((t, idx) => {
    const row = sheetStats.getRow(rowIdxStats);
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

    const cellNote = row.getCell(5);
    cellNote.value = idx === 0 && t.wins > 0 ? 'Flest seiere' : '';
    cellNote.font = { name: 'Arial', size: 9, italic: true };
    cellNote.alignment = { horizontal: 'center', vertical: 'middle' };
    cellNote.border = thinBorder;

    rowIdxStats++;
  });

  sheetStats.getColumn(1).width = 16;
  sheetStats.getColumn(2).width = 30;
  sheetStats.getColumn(3).width = 20;
  sheetStats.getColumn(4).width = 20;
  sheetStats.getColumn(5).width = 20;

  // =========================================================================
  // GENERER OG LAST NED FIL
  // =========================================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const safeTitle = (title || 'Quiz').replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_');
  const filename = `${safeTitle}_${dateStr}_komplett.xlsx`;

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
