/**
 * Ranheim Kraft – Vipps Boks Komponent
 * Frivillig støtte basert på Vipps Boks (uten bedrifts-API)
 */

/* =========================================================================
   1. KONFIGURASJONSVARIABLER
   ========================================================================= */
const VIPPS_KODE = '3153MT';
const VIPPS_BOKS_URL = 'https://qr.vipps.no/box/3153MT/pay-in';

/* =========================================================================
   2. RENDERING AV VIPPS-KOMPONENT
   ========================================================================= */
function renderVippsWidget() {
  const container = document.getElementById('vipps-widget');
  if (!container) return;

  container.innerHTML = `
    <section class="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-4 max-w-xl mx-auto my-6" aria-label="Støtt siden med Vipps">
      <div class="space-y-1">
        <h3 class="font-syne font-bold text-base sm:text-lg text-white tracking-tight">
          Støtt siden med Vipps
        </h3>
        <p class="text-xs text-zinc-400 font-sans max-w-sm mx-auto leading-relaxed">
          Uavhengig drift, fotografering og analyser fra fjæra. Alle bidrag går uavkortet til servere og medieutstyr.
        </p>
      </div>

      <div class="pt-1 flex flex-col items-center justify-center gap-2">
        <a 
          href="${VIPPS_BOKS_URL}" 
          target="_blank" 
          rel="noopener noreferrer" 
          data-umami-event="vipps_box_click"
          class="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-full bg-[#ff5b24] hover:bg-[#e04815] active:scale-[0.98] transition-all text-white font-sans font-bold text-base shadow-lg shadow-[#ff5b24]/20 group cursor-pointer"
          title="Åpne Vipps boks ${VIPPS_KODE}"
        >
          <!-- Vipps Iconic Smile -->
          <svg class="w-5 h-5 text-white" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M10 21C11.5 25.5 15.5 28 20 28C24.5 28 28.5 25.5 30 21" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
          </svg>
          <span class="tracking-wide">Vipps</span>
        </a>

        <!-- Hjelpetekst for PC & mobil -->
        <p class="text-[11px] sm:text-xs font-mono text-zinc-400 pt-1">
          Åpner Vipps direkte på mobil, eller søk opp boks <strong class="text-white font-semibold">${VIPPS_KODE}</strong> i Vipps.
        </p>
      </div>
    </section>
  `;
}

// Kjør rendering når DOM er klar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderVippsWidget);
} else {
  renderVippsWidget();
}
