/**
 * Ranheim Kraft – Vipps Boks & 6-måneders lisensmodul
 * Integrert med Ranheim Kraft Vipps-boks 3153MT
 */

const VIPPS_CONFIG = {
  kode: '3153MT',
  payInUrl: 'https://qr.vipps.no/box/2c57f671-a1a6-4059-9ecd-6db37065517b/pay-in',
  defaultFreeMonths: 6
};

/**
 * Beregner utløpsdato 6 måneder fra nå
 * @returns {{dateString: string, timestamp: number, isoString: string}}
 */
function calculateExpiryDate(months = 6) {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + months);
  
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const dateString = expiry.toLocaleDateString('nb-NO', options);
  
  return {
    dateString,
    timestamp: expiry.getTime(),
    isoString: expiry.toISOString().split('T')[0]
  };
}

/**
 * Rendrer Vipps-boksen i container
 */
function renderVippsWidget(containerId = 'vipps-widget') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const expiry = calculateExpiryDate(VIPPS_CONFIG.defaultFreeMonths);

  container.innerHTML = `
    <div class="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff5b24]/10 border border-[#ff5b24]/20 text-[#ff5b24] text-xs font-mono font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-[#ff5b24] animate-pulse"></span>
          Gratis brukslisens: 6 måneder
        </div>
        <h4 class="font-syne font-bold text-base sm:text-lg text-white tracking-tight">
          Støtt videre drift etter 6 mnd
        </h4>
        <p class="text-xs text-zinc-400 font-sans max-w-md mx-auto leading-relaxed">
          Koden din er 100 % gratis og uten reklame. Dersom koden brukes aktivt etter <span class="text-white font-medium">${expiry.dateString}</span>, ber vi om et valgfritt bidrag til Ranheim Kraft for servere og verktøyutvikling.
        </p>
      </div>

      <div class="flex flex-col items-center justify-center gap-2 pt-1">
        <a 
          href="${VIPPS_CONFIG.payInUrl}" 
          target="_blank" 
          rel="noopener noreferrer" 
          data-umami-event="vipps_qr_support"
          class="vipps-glow inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-[#ff5b24] hover:bg-[#e04815] active:scale-[0.98] transition-all text-white font-sans font-bold text-sm sm:text-base shadow-lg shadow-[#ff5b24]/25 cursor-pointer group"
          title="Åpne Ranheim Kraft Vipps boks ${VIPPS_CONFIG.kode}"
        >
          <!-- Vipps Iconic Smile -->
          <svg class="w-5 h-5 text-white transition-transform group-hover:scale-110" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M10 21C11.5 25.5 15.5 28 20 28C24.5 28 28.5 25.5 30 21" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
          </svg>
          <span class="tracking-wide">Vipps Ranheim Kraft</span>
        </a>

        <p class="text-[11px] font-mono text-zinc-400">
          Vipps boks: <strong class="text-white font-semibold">${VIPPS_CONFIG.kode}</strong>
        </p>
      </div>
    </div>
  `;
}

// Eksporter for bruk i app.js
window.RanheimVipps = {
  config: VIPPS_CONFIG,
  calculateExpiryDate,
  renderVippsWidget
};
