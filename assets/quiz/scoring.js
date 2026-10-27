/**
 * scoring.js - Håndtering av poengberegning, desimaler og tie-breaker sortering
 * For Quiz Kraft (ranheimkraft.no)
 */

/**
 * Tolker et poengtall fra brukerinput.
 * Støtter både komma og punktum (f.eks. "8,5", "8.5", "10", ",5").
 * Returnerer null hvis feltet er tomt eller ugyldig.
 */
function parseScore(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().replace(',', '.');
  if (str === '') return null;
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  // Rund av til 2 desimaler for å unngå IEEE-754 flyttallsavrundingsfeil
  return Math.round(num * 100) / 100;
}

/**
 * Formaterer et tall til pen norsk visning med komma.
 * F.eks. 8.5 -> "8,5", 10 -> "10", null -> ""
 */
function formatScore(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  const rounded = Math.round(num * 100) / 100;
  // Hvis det er heltall, vis uten desimaler
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return String(rounded).replace('.', ',');
}

/**
 * Beregner sammenlagt sum for et lag.
 * Tomme runder regnes som 0 i summen.
 */
function calculateTeamTotal(team, roundCount) {
  let sum = 0;
  for (let r = 0; r < roundCount; r++) {
    const rawVal = team.scores ? team.scores[r] : null;
    const val = parseScore(rawVal);
    if (val !== null) {
      sum += val;
    }
  }
  return Math.round(sum * 100) / 100;
}

/**
 * Finner indeksen til den SISTE runden som faktisk har registrert poeng (for minst ett lag).
 * Returnerer -1 hvis ingen poeng er ført inn i noen runde.
 */
function getLastPlayedRoundIndex(teams, roundCount) {
  for (let r = roundCount - 1; r >= 0; r--) {
    for (let t = 0; t < teams.length; t++) {
      const val = parseScore(teams[t].scores ? teams[t].scores[r] : null);
      if (val !== null) {
        return r; // Funnet den seneste runden med poeng
      }
    }
  }
  return -1;
}

/**
 * Sammenligner to lag basert på total og tie-breaker bakover fra siste spilte runde.
 * Returnerer negativt tall hvis a skal foran b, positivt hvis b skal foran a, 0 ved absolutt likhet.
 */
function compareTeams(a, b, lastPlayedRoundIdx) {
  // 1. Total poengsum synkende
  if (b.total !== a.total) {
    return b.total - a.total;
  }

  // 2. Tie-breaker bakover runde for runde fra siste spilte runde
  if (lastPlayedRoundIdx >= 0) {
    for (let r = lastPlayedRoundIdx; r >= 0; r--) {
      const scoreA = parseScore(a.scores ? a.scores[r] : null) || 0;
      const scoreB = parseScore(b.scores ? b.scores[r] : null) || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
    }
  }

  // 3. Helt identisk i alle runder
  return 0;
}

/**
 * Sorterer lagene etter poeng med flertrinns tie-breaker:
 * 1. Høyest sammenlagt poengsum
 * 2. Ved poenglikhet: Flest poeng i siste spilte runde
 * 3. Ved fortsatt likhet: Flest poeng i runden før der igjen (bakover runde for runde)
 * 4. Hvis helt identisk i alle runder: Delt plassering
 * 
 * Returnerer en ny array med oppdatert 'rank' og 'tieBreakerNote'.
 */
function sortTeamsWithTieBreaker(teams, roundCount) {
  if (!teams || teams.length === 0) return [];

  // Beregn totaler først
  const teamsWithTotals = teams.map((team) => {
    const total = calculateTeamTotal(team, roundCount);
    return {
      ...team,
      scores: team.scores ? [...team.scores] : [],
      total: total,
      tieBreakerNote: ''
    };
  });

  const lastPlayedRoundIdx = getLastPlayedRoundIndex(teamsWithTotals, roundCount);

  // Sortering
  const sorted = [...teamsWithTotals].sort((a, b) => compareTeams(a, b, lastPlayedRoundIdx));

  // Tildel plasseringstall (1, 2, 3...)
  // To lag deler kun plassering hvis compareTeams returnerer 0 (absolutt uavgjort)
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      if (compareTeams(sorted[i - 1], sorted[i], lastPlayedRoundIdx) === 0) {
        sorted[i].rank = sorted[i - 1].rank;
      } else {
        sorted[i].rank = i + 1;
      }
    } else {
      sorted[i].rank = 1;
    }
  }

  // Generer lettforståelige forklaringer for alle lag som har poenglikhet
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const hasTotalTie = 
      (i > 0 && sorted[i - 1].total === cur.total) ||
      (i + 1 < sorted.length && sorted[i + 1].total === cur.total);

    if (hasTotalTie && i > 0 && sorted[i - 1].total === cur.total) {
      const prev = sorted[i - 1];
      if (compareTeams(prev, cur, lastPlayedRoundIdx) === 0) {
        // Helt identisk
        cur.tieBreakerNote = `Delt ${cur.rank}. plass (Likt i alle runder)`;
        if (!prev.tieBreakerNote) {
          prev.tieBreakerNote = `Delt ${prev.rank}. plass (Likt i alle runder)`;
        }
      } else {
        // Skilt av en bestemt runde
        for (let r = lastPlayedRoundIdx; r >= 0; r--) {
          const scorePrev = parseScore(prev.scores ? prev.scores[r] : null) || 0;
          const scoreCur = parseScore(cur.scores ? cur.scores[r] : null) || 0;
          if (scorePrev !== scoreCur) {
            const rNum = r + 1;
            if (!prev.tieBreakerNote) {
              prev.tieBreakerNote = `Foran på runde ${rNum} (${formatScore(scorePrev)} mot ${formatScore(scoreCur)})`;
            }
            cur.tieBreakerNote = `Bak på runde ${rNum} (${formatScore(scoreCur)} mot ${formatScore(scorePrev)})`;
            break;
          }
        }
      }
    }
  }

  return sorted;
}

// Gjør modulene tilgjengelige globalt for browser uten byggverktøy
window.QuizScoring = {
  parseScore,
  formatScore,
  calculateTeamTotal,
  getLastPlayedRoundIndex,
  compareTeams,
  sortTeamsWithTieBreaker
};
