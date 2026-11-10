/**
 * Ranheim Kraft – Felles meny og bunntekst
 * Brukes av index.html, galleri.html og changelog.html.
 *
 * Bruk (synkront, der elementet skal stå):
 *   <script src="assets/layout.js" data-part="nav" data-page="index"></script>
 *   <script src="assets/layout.js" data-part="footer" data-page="index"></script>
 *
 * Skriptet setter inn HTML rett før sin egen <script>-tagg, slik at menyen
 * er på plass før resten av siden tegnes (ingen hopp i layouten).
 */
(function () {
  const script = document.currentScript;
  if (!script) return;

  const part = script.dataset.part;
  const page = script.dataset.page || '';
  const isHome = page === 'index';

  const NAV_LINKS = [
    { href: 'quiz.html', label: 'Quiz Kraft', color: 'text-amber-400', event: 'header_quiz_click' },
    { href: 'qr.html', label: 'QR Kraft', color: 'text-cyan-400', event: 'header_qr_click' },
    { href: 'tabell/', label: 'Tabell Kraft', color: 'text-sky-400', event: 'header_tabell_click' },
    { href: 'events/', label: 'TRD Events', color: 'text-emerald-400', event: 'header_events_click' },
    { href: 'galleri.html', label: 'Bildegalleri', color: '', event: 'header_galleri_click', page: 'galleri' }
  ];

  function navHtml() {
    const brand = isHome
      ? `<div class="flex items-center gap-2.5">
           <span class="w-2 h-2 rounded-full bg-cyan-400" aria-hidden="true"></span>
           <span class="text-white font-bold tracking-wider font-syne uppercase text-sm">Ranheim Kraft</span>
         </div>`
      : `<a href="index.html" class="flex items-center gap-2 text-zinc-400 hover:text-white transition group">
           <span class="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">&larr;</span>
           <span class="text-white font-bold tracking-wider font-syne uppercase text-sm">Ranheim Kraft</span>
         </a>`;

    const links = NAV_LINKS.map(link => {
      const isCurrent = link.page && link.page === page;
      const color = isCurrent ? 'text-white' : (link.color || '');
      const weight = link.color || isCurrent ? 'font-medium' : '';
      return `<a href="${link.href}" data-umami-event="${link.event}"${isCurrent ? ' aria-current="page"' : ''} class="${color} ${weight} hover:text-white transition">${link.label}</a>`;
    }).join('\n');

    return `
      <nav aria-label="Hovedmeny" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-white/10 text-xs font-mono">
        ${brand}
        <div class="flex items-center gap-3.5 sm:gap-5 text-zinc-400 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 whitespace-nowrap text-[11px] sm:text-xs">
          ${links}
          <a href="https://github.com/RanheimGeriljaTV" target="_blank" rel="noopener noreferrer" class="hover:text-white transition hidden md:inline">GitHub &rarr;</a>
        </div>
      </nav>`;
  }

  function footerHtml() {
    const items = [];
    if (!isHome) items.push('<a href="index.html" class="hover:text-white transition">Hovedside</a>');
    items.push('<button type="button" onclick="openFeedbackModal()" class="hover:text-white transition flex items-center gap-1 cursor-pointer text-zinc-400"><span aria-hidden="true">🐛</span> <span>Rapporter feil</span></button>');
    if (page !== 'changelog') items.push('<a href="changelog.html" class="hover:text-white transition">Changelog</a>');
    items.push('<a href="https://github.com/RanheimGeriljaTV/ranheimkraft.no" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">GitHub</a>');

    return `
      <footer class="mt-auto pt-8 border-t border-white/10 text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3" style="padding-bottom: env(safe-area-inset-bottom);">
        <div>&copy; ${new Date().getFullYear()} Ranheim Kraft</div>
        <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          ${items.join('\n<span aria-hidden="true">&bull;</span>\n')}
        </div>
      </footer>`;
  }

  if (part === 'nav') script.insertAdjacentHTML('beforebegin', navHtml());
  if (part === 'footer') script.insertAdjacentHTML('beforebegin', footerHtml());
})();
