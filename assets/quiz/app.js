/**
 * app.js - Hovedapplikasjon, initialisering, presentasjonsmodus og utvidelser
 * For Quiz Kraft (ranheimkraft.no)
 */

function initQuizApp() {
  // 1. Initialiser tilstand
  let state = window.QuizStorage.loadStateFromStorage();

  // 2. Klargjør tittel og dato
  const titleInput = document.getElementById('quiz-title-input');
  const dateInput = document.getElementById('quiz-date-input');
  const presDisplayTitle = document.getElementById('pres-display-title');
  const presDisplayDate = document.getElementById('pres-display-date');

  function updateTitleDisplays() {
    const curTitle = state.title || 'Ranheim Quiz';
    if (titleInput) titleInput.value = curTitle;
    if (presDisplayTitle) presDisplayTitle.textContent = curTitle;
    document.title = `${curTitle} - Poengtavle`;
  }

  function updateDateDisplays() {
    const curDate = state.date || new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = curDate;
    if (presDisplayDate) {
      try {
        const d = new Date(curDate);
        presDisplayDate.textContent = d.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        presDisplayDate.textContent = curDate;
      }
    }
  }

  updateTitleDisplays();
  updateDateDisplays();

  titleInput.addEventListener('input', (e) => {
    state.title = e.target.value.trim() || 'Ranheim Quiz';
    updateTitleDisplays();
    saveAppState(false);
  });

  dateInput.addEventListener('change', (e) => {
    state.date = e.target.value;
    updateDateDisplays();
    saveAppState(true);
  });

  // 3. Callback for endringer fra regneark-tabellen
  function handleStateChange(newState, saveToDisk = true) {
    state = newState;
    if (saveToDisk) {
      saveAppState(false);
    }
  }

  function saveAppState(pushUndo = false) {
    if (pushUndo) {
      window.QuizStorage.pushUndoState(state);
    }
    window.QuizStorage.saveStateToStorage(state);
  }

  // 4. Initialiser regneark-visningen
  window.QuizSpreadsheet.initSpreadsheet(state, handleStateChange);

  // 5. Kompakt statusvisning for automatisk lagring
  const statusTimestampEl = document.getElementById('storage-timestamp');
  window.QuizStorage.onStatusChange((isoDate) => {
    if (statusTimestampEl && isoDate) {
      const d = new Date(isoDate);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      statusTimestampEl.textContent = `(kl. ${timeStr})`;
    }
  });
  if (state.updatedAt && statusTimestampEl) {
    const d = new Date(state.updatedAt);
    statusTimestampEl.textContent = `(kl. ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  }

  // 6. Handlinger: Legg til lag, runde, sortering, angre
  const btnAddTeam = document.getElementById('btn-add-team');
  const btnAddRound = document.getElementById('btn-add-round');
  const btnSortScores = document.getElementById('btn-sort-scores');
  const btnUndo = document.getElementById('btn-undo');
  const inputTeamCount = document.getElementById('input-team-count');
  const inputRoundCount = document.getElementById('input-round-count');

  if (inputTeamCount) {
    inputTeamCount.addEventListener('change', (e) => {
      window.QuizSpreadsheet.setTeamCount(e.target.value);
    });
    inputTeamCount.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.QuizSpreadsheet.setTeamCount(e.target.value);
        inputTeamCount.blur();
      }
    });
  }

  if (inputRoundCount) {
    inputRoundCount.addEventListener('change', (e) => {
      window.QuizSpreadsheet.setRoundCount(e.target.value);
    });
    inputRoundCount.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.QuizSpreadsheet.setRoundCount(e.target.value);
        inputRoundCount.blur();
      }
    });
  }

  if (btnAddTeam) {
    btnAddTeam.addEventListener('click', () => {
      window.QuizSpreadsheet.addTeam();
    });
  }

  if (btnAddRound) {
    btnAddRound.addEventListener('click', () => {
      window.QuizSpreadsheet.addRound();
    });
  }

  if (btnSortScores) {
    btnSortScores.addEventListener('click', () => {
      window.QuizSpreadsheet.sortTeams();
    });
  }

  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      const prevState = window.QuizStorage.popUndoState();
      if (prevState) {
        state = prevState;
        updateTitleDisplays();
        updateDateDisplays();
        window.QuizSpreadsheet.updateState(state);
        window.QuizStorage.saveStateToStorage(state);
      }
    });
  }

  // 7. PRESENTASJONSMODUS & FULLSKJERM
  const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
  const presBtnExit = document.getElementById('pres-btn-exit-fullscreen');

  function enterPresentationMode() {
    document.body.classList.add('presentation-mode');
    window.QuizSpreadsheet.setPresentationMode(true);
    updateTitleDisplays();
    updateDateDisplays();

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function exitPresentationMode() {
    document.body.classList.remove('presentation-mode');
    window.QuizSpreadsheet.setPresentationMode(false);
    stopCarousel();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  if (btnToggleFullscreen) {
    btnToggleFullscreen.addEventListener('click', enterPresentationMode);
  }
  if (presBtnExit) {
    presBtnExit.addEventListener('click', exitPresentationMode);
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      exitPresentationMode();
    } else {
      enterPresentationMode();
    }
  });

  // 8. VISNINGER FOR 15–25+ LAG (Alle, Topp 10, Topp 5)
  const btnViewAll = document.getElementById('btn-view-all');
  const btnViewTop10 = document.getElementById('btn-view-top10');
  const btnViewTop5 = document.getElementById('btn-view-top5');
  const presBtnAll = document.getElementById('pres-btn-filter-all');
  const presBtnTop10 = document.getElementById('pres-btn-filter-top10');
  const presBtnTop5 = document.getElementById('pres-btn-filter-top5');

  function setFilter(filter) {
    window.QuizSpreadsheet.setViewFilter(filter);
    [btnViewAll, presBtnAll].forEach(b => b && b.classList.toggle('active', filter === 'all'));
    [btnViewTop10, presBtnTop10].forEach(b => b && b.classList.toggle('active', filter === 'top10'));
    [btnViewTop5, presBtnTop5].forEach(b => b && b.classList.toggle('active', filter === 'top5'));
  }

  if (btnViewAll) btnViewAll.addEventListener('click', () => setFilter('all'));
  if (btnViewTop10) btnViewTop10.addEventListener('click', () => setFilter('top10'));
  if (btnViewTop5) btnViewTop5.addEventListener('click', () => setFilter('top5'));
  if (presBtnAll) presBtnAll.addEventListener('click', () => setFilter('all'));
  if (presBtnTop10) presBtnTop10.addEventListener('click', () => setFilter('top10'));
  if (presBtnTop5) presBtnTop5.addEventListener('click', () => setFilter('top5'));

  // 9. 2-KOLONNER SIDE-OM-SIDE (Perfekt for 20-30 lag på lerret)
  const btnToggle2Col = document.getElementById('btn-toggle-2col');
  const presBtn2Col = document.getElementById('pres-btn-toggle-2col');

  function toggle2ColumnLayout() {
    const nextVal = !window.QuizSpreadsheet.get2ColumnLayout();
    window.QuizSpreadsheet.set2ColumnLayout(nextVal);
    update2ColButtons(nextVal);
  }

  function update2ColButtons(active) {
    [btnToggle2Col, presBtn2Col].forEach(b => {
      if (b) {
        b.classList.toggle('active', active);
        b.textContent = active ? '☑️ 2 Kolonner (Aktiv)' : '🔲 2 Kolonner';
      }
    });
  }

  if (btnToggle2Col) btnToggle2Col.addEventListener('click', toggle2ColumnLayout);
  if (presBtn2Col) presBtn2Col.addEventListener('click', toggle2ColumnLayout);

  // 10. RULLERENDE KARUSELL (Side 1 av 2 osv. hvert 8. sekund)
  const btnCarousel = document.getElementById('btn-carousel');
  const presBtnCarousel = document.getElementById('pres-btn-carousel');
  let carouselInterval = null;

  function toggleCarousel() {
    if (carouselInterval) {
      stopCarousel();
    } else {
      startCarousel();
    }
  }

  function startCarousel() {
    window.QuizSpreadsheet.setViewFilter('page');
    carouselInterval = setInterval(() => {
      window.QuizSpreadsheet.nextPage();
    }, 8000);
    updateCarouselButtons(true);
  }

  function stopCarousel() {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }
    if (window.QuizSpreadsheet.getViewFilter() === 'page') {
      window.QuizSpreadsheet.setViewFilter('all');
    }
    updateCarouselButtons(false);
  }

  function updateCarouselButtons(running) {
    [btnCarousel, presBtnCarousel].forEach(b => {
      if (b) {
        b.classList.toggle('active', running);
        b.textContent = running ? '⏸️ Stopp rullering' : '▶️ Rullerende visning';
      }
    });
  }

  if (btnCarousel) btnCarousel.addEventListener('click', toggleCarousel);
  if (presBtnCarousel) presBtnCarousel.addEventListener('click', toggleCarousel);

  // 11. HEMMELIG FINALE (CLIFFHANGER-MODUS)
  const btnCliffhanger = document.getElementById('btn-cliffhanger');
  const presBtnCliffhanger = document.getElementById('pres-btn-cliffhanger');

  function toggleCliffhanger() {
    const nextVal = !window.QuizSpreadsheet.getHideLastRound();
    window.QuizSpreadsheet.setHideLastRound(nextVal);
    [btnCliffhanger, presBtnCliffhanger].forEach(b => {
      if (b) {
        b.classList.toggle('active', nextVal);
        b.textContent = nextVal ? '🔓 Vis siste runde' : '🤫 Skjul siste runde';
      }
    });
  }

  if (btnCliffhanger) btnCliffhanger.addEventListener('click', toggleCliffhanger);
  if (presBtnCliffhanger) presBtnCliffhanger.addEventListener('click', toggleCliffhanger);

  // 12. QUIZ-TIMER OG LYDVARSEL
  const modalTimer = document.getElementById('quiz-timer-modal');
  const btnOpenTimer = document.getElementById('btn-open-timer');
  const presBtnTimer = document.getElementById('pres-btn-timer');
  const btnCloseTimer = document.getElementById('btn-timer-close');
  const modalClock = document.getElementById('modal-timer-clock');
  const presTimerDisplay = document.getElementById('pres-timer-display');
  const presTimerClock = document.getElementById('pres-timer-clock');
  const btnTimerStart = document.getElementById('btn-timer-start');
  const btnTimerPause = document.getElementById('btn-timer-pause');
  const btnTimerReset = document.getElementById('btn-timer-reset');
  const presetButtons = document.querySelectorAll('.btn-preset');

  let timerTotalSeconds = 300; // 5 minutter standard
  let timerRemainingSeconds = 300;
  let timerInterval = null;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateClockDisplays() {
    const formatted = formatTime(timerRemainingSeconds);
    if (modalClock) modalClock.textContent = formatted;
    if (presTimerClock) presTimerClock.textContent = formatted;
  }

  function startTimer() {
    if (timerInterval) return;
    if (timerRemainingSeconds <= 0) {
      timerRemainingSeconds = timerTotalSeconds;
    }
    if (presTimerDisplay) presTimerDisplay.style.display = 'block';

    timerInterval = setInterval(() => {
      if (timerRemainingSeconds > 0) {
        timerRemainingSeconds--;
        updateClockDisplays();
      } else {
        pauseTimer();
        playChime();
        alert('⏰ Tiden er ute!');
      }
    }, 1000);
  }

  function pauseTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetTimer() {
    pauseTimer();
    timerRemainingSeconds = timerTotalSeconds;
    updateClockDisplays();
  }

  function playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.9);
      });
    } catch (e) {
      console.warn('Lyd kunne ikke spilles:', e);
    }
  }

  if (btnOpenTimer) {
    btnOpenTimer.addEventListener('click', () => {
      if (modalTimer) modalTimer.style.display = 'flex';
    });
  }
  if (presBtnTimer) {
    presBtnTimer.addEventListener('click', () => {
      if (modalTimer) modalTimer.style.display = 'flex';
    });
  }
  if (btnCloseTimer) {
    btnCloseTimer.addEventListener('click', () => {
      if (modalTimer) modalTimer.style.display = 'none';
    });
  }
  if (btnTimerStart) btnTimerStart.addEventListener('click', startTimer);
  if (btnTimerPause) btnTimerPause.addEventListener('click', pauseTimer);
  if (btnTimerReset) btnTimerReset.addEventListener('click', resetTimer);

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const min = parseInt(btn.dataset.min, 10) || 5;
      timerTotalSeconds = min * 60;
      resetTimer();
    });
  });

  // 12B. RUNDE-ANALYSE OG GRAFER
  const modalAnalysis = document.getElementById('quiz-analysis-modal');
  const btnOpenAnalysis = document.getElementById('btn-open-analysis');
  const presBtnAnalysis = document.getElementById('pres-btn-analysis');
  const btnAnalysisClose = document.getElementById('btn-analysis-close');
  const tabBtnWinners = document.getElementById('tab-btn-winners');
  const tabBtnGraph = document.getElementById('tab-btn-graph');
  const contentWinners = document.getElementById('analysis-content-winners');
  const contentGraph = document.getElementById('analysis-content-graph');
  const chartCanvas = document.getElementById('quiz-chart-canvas');
  const btnChartModeCumulative = document.getElementById('btn-chart-mode-cumulative');
  const btnChartModePerRound = document.getElementById('btn-chart-mode-per-round');
  const btnAnalysisDownloadExcel = document.getElementById('btn-analysis-download-excel');

  let currentChartMode = 'cumulative';

  function openAnalysisModal() {
    if (!modalAnalysis) return;
    populateAnalysisData();
    modalAnalysis.style.display = 'flex';
    switchAnalysisTab('winners');
  }

  function closeAnalysisModal() {
    if (modalAnalysis) modalAnalysis.style.display = 'none';
  }

  function switchAnalysisTab(tab) {
    if (tab === 'winners') {
      tabBtnWinners.classList.add('active');
      tabBtnGraph.classList.remove('active');
      contentWinners.style.display = 'block';
      contentGraph.style.display = 'none';
    } else {
      tabBtnWinners.classList.remove('active');
      tabBtnGraph.classList.add('active');
      contentWinners.style.display = 'none';
      contentGraph.style.display = 'block';
      setTimeout(renderAnalysisChart, 50);
    }
  }

  function populateAnalysisData() {
    if (!window.QuizRoundAnalysis) return;
    const roundWinners = window.QuizRoundAnalysis.getRoundWinners(state.teams, state.roundCount, state.roundNames);
    const tally = window.QuizRoundAnalysis.getTeamWinsTally(state.teams, roundWinners);

    // 1. Bygg kort for hver runde
    const cardsContainer = document.getElementById('round-winners-cards');
    if (cardsContainer) {
      let cardsHtml = '';
      roundWinners.forEach(rw => {
        const winnerNames = rw.winners.map(w => w.name).join(', ') || 'Ingen poeng ført ennå';
        const scoreText = rw.hasScores ? `🏆 ${window.QuizScoring ? window.QuizScoring.formatScore(rw.maxScore) : rw.maxScore} poeng` : '-';

        cardsHtml += `
          <div class="round-card">
            <div class="round-card-header">
              <span>${rw.roundTitle}</span>
              <span>${scoreText}</span>
            </div>
            <div class="round-winner-name">
              ${rw.hasScores ? `🥇 ${winnerNames}` : '<span style="color:#888; font-size:1rem; font-weight:normal;">Ikke spilt</span>'}
            </div>
            ${rw.hasScores ? `
              <div class="round-stat-row">
                <span>Gjennomsnitt:</span>
                <strong>${window.QuizScoring ? window.QuizScoring.formatScore(rw.avgScore) : rw.avgScore} p</strong>
              </div>
              <div class="round-stat-row">
                <span>Laveste score:</span>
                <strong>${window.QuizScoring ? window.QuizScoring.formatScore(rw.minScore) : rw.minScore} p</strong>
              </div>
            ` : ''}
          </div>
        `;
      });
      cardsContainer.innerHTML = cardsHtml;
    }

    // 2. Bygg liste for flest seiere
    const tallyContainer = document.getElementById('round-tally-list');
    if (tallyContainer) {
      let tallyHtml = '';
      tally.slice(0, 10).forEach((t, idx) => {
        let badgeIcon = idx === 0 && t.wins > 0 ? '👑 ' : '';
        tallyHtml += `
          <div class="tally-item">
            <span>${idx + 1}. ${badgeIcon}<strong>${t.name}</strong></span>
            <div>
              <span class="tally-badge">${t.wins} rundeseier${t.wins === 1 ? '' : 'e'}</span>
              <small style="color:var(--text-muted); margin-left: 0.5rem;">(Beste: ${window.QuizScoring ? window.QuizScoring.formatScore(t.bestScore) : t.bestScore} p)</small>
            </div>
          </div>
        `;
      });
      tallyContainer.innerHTML = tallyHtml;
    }
  }

  function renderAnalysisChart() {
    if (chartCanvas && window.QuizRoundAnalysis) {
      window.QuizRoundAnalysis.drawQuizChart(
        chartCanvas,
        state.teams,
        state.roundCount,
        state.roundNames,
        currentChartMode
      );
    }
  }

  if (btnOpenAnalysis) btnOpenAnalysis.addEventListener('click', openAnalysisModal);
  if (presBtnAnalysis) presBtnAnalysis.addEventListener('click', openAnalysisModal);
  if (btnAnalysisClose) btnAnalysisClose.addEventListener('click', closeAnalysisModal);

  if (tabBtnWinners) tabBtnWinners.addEventListener('click', () => switchAnalysisTab('winners'));
  if (tabBtnGraph) tabBtnGraph.addEventListener('click', () => switchAnalysisTab('graph'));

  if (btnChartModeCumulative) {
    btnChartModeCumulative.addEventListener('click', () => {
      currentChartMode = 'cumulative';
      btnChartModeCumulative.classList.add('active');
      btnChartModePerRound.classList.remove('active');
      renderAnalysisChart();
    });
  }

  if (btnChartModePerRound) {
    btnChartModePerRound.addEventListener('click', () => {
      currentChartMode = 'per_round';
      btnChartModePerRound.classList.add('active');
      btnChartModeCumulative.classList.remove('active');
      renderAnalysisChart();
    });
  }

  if (btnAnalysisDownloadExcel) {
    btnAnalysisDownloadExcel.addEventListener('click', () => {
      if (window.QuizExcelExport) {
        window.QuizExcelExport.exportQuizToExcel(state);
      }
    });
  }

  // 13. TEKSTSTØRRELSE-SKALERING (A+ / A-)
  const fontSteps = [13, 15, 17, 20, 24, 28];
  let currentFontIndex = 1; // 15px standard

  const btnFontLarger = document.getElementById('btn-font-larger');
  const btnFontSmaller = document.getElementById('btn-font-smaller');
  const presBtnFontLarger = document.getElementById('pres-btn-font-larger');
  const presBtnFontSmaller = document.getElementById('pres-btn-font-smaller');

  function applyFontScale(px) {
    document.documentElement.style.setProperty('--font-scale', `${px}px`);
    localStorage.setItem('quiz_kraft_font_scale', px);
    if (btnFontSmaller) btnFontSmaller.disabled = (currentFontIndex === 0);
    if (btnFontLarger) btnFontLarger.disabled = (currentFontIndex === fontSteps.length - 1);
    if (presBtnFontSmaller) presBtnFontSmaller.disabled = (currentFontIndex === 0);
    if (presBtnFontLarger) presBtnFontLarger.disabled = (currentFontIndex === fontSteps.length - 1);
  }

  const savedFont = parseInt(localStorage.getItem('quiz_kraft_font_scale'), 10);
  if (!isNaN(savedFont)) {
    const foundIdx = fontSteps.indexOf(savedFont);
    if (foundIdx !== -1) currentFontIndex = foundIdx;
  }
  applyFontScale(fontSteps[currentFontIndex]);

  if (btnFontLarger) {
    btnFontLarger.addEventListener('click', () => {
      if (currentFontIndex < fontSteps.length - 1) {
        currentFontIndex++;
        applyFontScale(fontSteps[currentFontIndex]);
      }
    });
  }

  if (btnFontSmaller) {
    btnFontSmaller.addEventListener('click', () => {
      if (currentFontIndex > 0) {
        currentFontIndex--;
        applyFontScale(fontSteps[currentFontIndex]);
      }
    });
  }

  if (presBtnFontLarger && btnFontLarger) {
    presBtnFontLarger.addEventListener('click', () => btnFontLarger.click());
  }

  if (presBtnFontSmaller && btnFontSmaller) {
    presBtnFontSmaller.addEventListener('click', () => btnFontSmaller.click());
  }

  // 14. LYS / MØRK MODUS
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  const savedTheme = localStorage.getItem('quiz_kraft_theme') || 'light';
  applyTheme(savedTheme);

  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-theme');
      const nextTheme = isDark ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('quiz_kraft_theme', nextTheme);
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      if (btnToggleTheme) {
        btnToggleTheme.innerHTML = '☀️ Bytt til lys skjerm';
      }
    } else {
      document.body.classList.remove('dark-theme');
      if (btnToggleTheme) {
        btnToggleTheme.innerHTML = '🌓 Bytt til mørk skjerm';
      }
    }
  }

  // 15. FILHÅNDTERING: JSON EKSPORT OG IMPORT
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      window.QuizStorage.exportQuizToJson(state);
    });
  }

  const btnImportJson = document.getElementById('btn-import-json');
  const fileImportInput = document.getElementById('file-import-json');

  if (btnImportJson && fileImportInput) {
    btnImportJson.addEventListener('click', () => {
      fileImportInput.value = '';
      fileImportInput.click();
    });

    fileImportInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const importedState = await window.QuizStorage.importQuizFromJson(file);
        const confirmRestore = window.confirm(`Vil du åpne quizen "${importedState.title || file.name}"? Dette vil erstatte det som vises på skjermen nå.`);
        if (!confirmRestore) return;

        window.QuizStorage.pushUndoState(state);
        state = importedState;
        
        updateTitleDisplays();
        updateDateDisplays();

        window.QuizSpreadsheet.updateState(state);
        window.QuizStorage.saveStateToStorage(state);
        alert('Quizen ble åpnet og er klar!');
      } catch (err) {
        alert(`Feil ved åpning av quiz-fil: ${err.message}`);
      }
    });
  }

  // 16. EKSPORT TIL EXCEL OG UTSKRIFT
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      if (window.QuizExcelExport) {
        window.QuizExcelExport.exportQuizToExcel(state);
      }
    });
  }

  const btnPrintTable = document.getElementById('btn-print-table');
  if (btnPrintTable) {
    btnPrintTable.addEventListener('click', () => {
      window.print();
    });
  }

  // 17. START NY QUIZ
  const btnResetQuiz = document.getElementById('btn-reset-quiz');
  if (btnResetQuiz) {
    btnResetQuiz.addEventListener('click', () => {
      const proceed = window.confirm('Er du helt sikker på at du vil starte en helt ny quiz?\n\nDette oppretter et tomt ark med 5 nye lag.');
      if (!proceed) return;

      window.QuizStorage.pushUndoState(state);
      state = window.QuizStorage.createDefaultState();
      
      updateTitleDisplays();
      updateDateDisplays();

      window.QuizSpreadsheet.updateState(state);
      window.QuizStorage.saveStateToStorage(state);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuizApp);
} else {
  initQuizApp();
}

