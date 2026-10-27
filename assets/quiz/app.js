/**
 * app.js - Hovedapplikasjon, initialisering og kobling av brukergrensesnitt
 * For Quiz Kraft (ranheimkraft.no)
 */

function initQuizApp() {
  // 1. Initialiser tilstand
  let state = window.QuizStorage.loadStateFromStorage();

  // 2. Klargjør tittel og dato
  const titleInput = document.getElementById('quiz-title-input');
  const dateInput = document.getElementById('quiz-date-input');

  if (titleInput && state.title) {
    titleInput.value = state.title;
    document.title = `${state.title} - Poengtavle`;
  }

  if (dateInput) {
    dateInput.value = state.date || new Date().toISOString().split('T')[0];
  }

  titleInput.addEventListener('input', (e) => {
    state.title = e.target.value.trim() || 'Ranheim Quiz';
    document.title = `${state.title} - Poengtavle`;
    saveAppState(false);
  });

  dateInput.addEventListener('change', (e) => {
    state.date = e.target.value;
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

  // 5. Status-banner for automatisk lagring
  const statusTimestampEl = document.getElementById('storage-timestamp');
  window.QuizStorage.onStatusChange((isoDate) => {
    if (statusTimestampEl && isoDate) {
      const d = new Date(isoDate);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      statusTimestampEl.textContent = `(sist kl. ${timeStr})`;
    }
  });
  // Vis initiell lagringstid
  if (state.updatedAt) {
    const d = new Date(state.updatedAt);
    if (statusTimestampEl) {
      statusTimestampEl.textContent = `(sist kl. ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }
  }

  // 6. Koble knapper for Legg til lag, runde, sortering, angre
  const btnAddTeam = document.getElementById('btn-add-team');
  const btnAddRound = document.getElementById('btn-add-round');
  const btnSortScores = document.getElementById('btn-sort-scores');
  const btnUndo = document.getElementById('btn-undo');

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
        if (titleInput) titleInput.value = state.title;
        if (dateInput) dateInput.value = state.date;
        window.QuizSpreadsheet.updateState(state);
        window.QuizStorage.saveStateToStorage(state);
      }
    });
  }

  // 7. Tekststørrelse-skalering (A+ / A-)
  const fontSteps = [15, 18, 22, 26, 30, 35];
  let currentFontIndex = 1; // Standard 18px

  const btnFontLarger = document.getElementById('btn-font-larger');
  const btnFontSmaller = document.getElementById('btn-font-smaller');

  function applyFontScale(px) {
    document.documentElement.style.setProperty('--font-scale', `${px}px`);
    localStorage.setItem('quiz_kraft_font_scale', px);
    if (btnFontSmaller) btnFontSmaller.disabled = (currentFontIndex === 0);
    if (btnFontLarger) btnFontLarger.disabled = (currentFontIndex === fontSteps.length - 1);
  }

  // Les lagret tekststørrelse hvis finnes
  const savedFont = parseInt(localStorage.getItem('quiz_kraft_font_scale'), 10);
  if (!isNaN(savedFont)) {
    const foundIdx = fontSteps.indexOf(savedFont);
    if (foundIdx !== -1) {
      currentFontIndex = foundIdx;
    }
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

  // 8. Lys / Mørk modus (Standard er lys som spesifisert)
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
        btnToggleTheme.title = 'Bytt tilbake til lys skjerm med hvit bakgrunn';
      }
    } else {
      document.body.classList.remove('dark-theme');
      if (btnToggleTheme) {
        btnToggleTheme.innerHTML = '🌓 Bytt til mørk skjerm';
        btnToggleTheme.title = 'Bytt til mørk skjerm for dempet belysning';
      }
    }
  }

  // 9. Fullskjerm for projektor
  const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
  if (btnToggleFullscreen) {
    btnToggleFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Kunne ikke åpne fullskjerm:', err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        btnToggleFullscreen.innerHTML = '↩️ Avslutt fullskjerm';
        btnToggleFullscreen.title = 'Gå ut av fullskjermvisning';
      } else {
        btnToggleFullscreen.innerHTML = '🖥️ Vis på fullskjerm (Projektor)';
        btnToggleFullscreen.title = 'Vis i fullskjerm på projektor eller storskjerm';
      }
    });
  }

  // 10. Filhåndtering: Eksport til JSON (Lagre på PC)
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      window.QuizStorage.exportQuizToJson(state);
    });
  }

  // 11. Filhåndtering: Import fra JSON (Åpne lagret quiz)
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
        
        // Bekreft før overskriving
        const confirmRestore = window.confirm(`Vil du åpne quizen "${importedState.title || file.name}"? Dette vil erstatte det som vises på skjermen nå.`);
        if (!confirmRestore) return;

        window.QuizStorage.pushUndoState(state);
        state = importedState;
        
        if (titleInput) titleInput.value = state.title;
        if (dateInput) dateInput.value = state.date;
        document.title = `${state.title} - Poengtavle`;

        window.QuizSpreadsheet.updateState(state);
        window.QuizStorage.saveStateToStorage(state);
        alert('Quizen ble åpnet og er klar til videre arbeid!');
      } catch (err) {
        alert(`Feil ved åpning av quiz-fil: ${err.message}`);
      }
    });
  }

  // 12. Eksport til Excel (.xlsx) via lokalt SheetJS
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      if (window.QuizExcelExport) {
        window.QuizExcelExport.exportQuizToExcel(state);
      }
    });
  }

  // 13. Utskrift på papir / Lag PDF
  const btnPrintTable = document.getElementById('btn-print-table');
  if (btnPrintTable) {
    btnPrintTable.addEventListener('click', () => {
      window.print();
    });
  }

  // 14. Start helt ny quiz (Nullstill alt)
  const btnResetQuiz = document.getElementById('btn-reset-quiz');
  if (btnResetQuiz) {
    btnResetQuiz.addEventListener('click', () => {
      const proceed = window.confirm('Er du helt sikker på at du vil starte en helt ny quiz?\n\nDette oppretter et tomt ark med 5 nye lag. (Tips: Du kan alltids trykke "Angre siste endring" hvis du angrer).');
      if (!proceed) return;

      window.QuizStorage.pushUndoState(state);
      state = window.QuizStorage.createDefaultState();
      
      if (titleInput) titleInput.value = state.title;
      if (dateInput) dateInput.value = state.date;
      document.title = `${state.title} - Poengtavle`;

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

