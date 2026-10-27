/**
 * Ranheim Kraft – Tilbakemelding & Feilrapportering
 * Spam-sikker og serverløs tilbakemeldingsmodul via Web3Forms (eller GitHub Issues)
 */

/* =========================================================================
   1. KONFIGURASJON (Trygg for offentlig GitHub-repo)
   ========================================================================= */
// Web3Forms Public Access Key (klient-nøkkel for sikker serverløs innsending)
const FORM_ACCESS_KEY = 'bdd9638c-4d2d-4a68-a65d-dfdbea23f21c';

// Offisiell GitHub Issues lenke for prosjektet
const GITHUB_ISSUES_URL = 'https://github.com/RanheimGeriljaTV/ranheimkraft.no/issues/new';

/* =========================================================================
   2. DOM MODAL STRUKTUR (Injisert automatisk)
   ========================================================================= */
function initFeedbackModal() {
  if (document.getElementById('feedback-modal')) return;

  const modalHtml = `
    <div id="feedback-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md hidden select-none" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div class="bg-[#0c0c0e] rounded-2xl p-6 sm:p-8 w-full max-w-lg border border-white/15 shadow-2xl relative space-y-5 text-left select-text" onclick="event.stopPropagation()">
        
        <!-- Modal Topplinje -->
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="space-y-0.5">
            <h3 id="feedback-title" class="text-base font-syne font-bold text-white flex items-center gap-2">
              <span>🐛</span>
              <span>Rapporter en feil / Tilbakemelding</span>
            </h3>
            <p class="text-xs text-zinc-400 font-mono">Hjelp oss å gjøre siden enda bedre</p>
          </div>
          <button type="button" onclick="closeFeedbackModal()" class="text-zinc-400 hover:text-white p-1 text-2xl leading-none transition cursor-pointer" aria-label="Lukk">&times;</button>
        </div>

        <!-- Bekreftelsesmelding (skjult som standard) -->
        <div id="feedback-success" class="hidden p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <div class="text-2xl">🎉</div>
          <h4 class="font-syne font-bold text-white text-base">Takk! Feilrapporten er sendt.</h4>
          <p class="text-xs text-zinc-300 font-sans leading-relaxed">
            Vi setter stor pris på at du sa ifra. Vi ser på saken så raskt som mulig!
          </p>
          <div class="pt-2">
            <button type="button" onclick="closeFeedbackModal()" class="px-5 py-2 rounded-xl bg-white text-black font-syne font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition cursor-pointer">
              Lukk vindu
            </button>
          </div>
        </div>

        <!-- Selve Skjemaet -->
        <form id="feedback-form" action="https://api.web3forms.com/submit" method="POST" onsubmit="submitFeedbackForm(event)" class="space-y-4">
          
          <!-- SKJULTE SPAM- OG SYSTEMFELTER (Web3Forms + Diagnostikk) -->
          <input type="hidden" name="access_key" value="${FORM_ACCESS_KEY}">
          <input type="hidden" name="name" value="Tilbakemelding fra nettside">
          <input type="hidden" name="subject" value="Ny feilrapport fra ranheimkraft.no">
          <input type="hidden" name="from_name" value="Ranheim Kraft Tilbakemelding">
          
          <!-- Honeypot spam-felle for roboter (skal aldri fylles ut av ekte mennesker) -->
          <input type="checkbox" name="botcheck" class="hidden" style="display: none !important;">
          
          <!-- Automatisk teknisk diagnose -->
          <input type="hidden" id="fb-page-url" name="page_url" value="">
          <input type="hidden" id="fb-user-agent" name="user_agent" value="">
          <input type="hidden" id="fb-screen-size" name="screen_size" value="">
          <input type="hidden" id="fb-timestamp" name="timestamp" value="">

          <!-- Kategori -->
          <div>
            <label for="fb-category" class="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
              Kategori:
            </label>
            <select id="fb-category" name="category" required class="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs font-mono transition">
              <option value="Bug">🐛 Noe virker ikke (Bug)</option>
              <option value="Forbedring">💡 Forslag til forbedring</option>
              <option value="Annet">💬 Annet</option>
            </select>
          </div>

          <!-- Beskrivelse -->
          <div>
            <label for="fb-message" class="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
              Beskrivelse <span class="text-rose-400">*</span>:
            </label>
            <textarea 
              id="fb-message" 
              name="message" 
              required 
              rows="4" 
              placeholder="Beskriv hva som skjedde, hva du forventet, eller hva du ønsker forbedret..."
              class="w-full px-4 py-2.5 rounded-xl bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs font-sans leading-relaxed placeholder-zinc-600 transition resize-y"
            ></textarea>
          </div>

          <!-- E-post (valgfritt) -->
          <div>
            <label for="fb-email" class="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
              Din e-post <span class="text-zinc-500 font-normal">(valgfritt, hvis du ønsker svar)</span>:
            </label>
            <input 
              type="email" 
              id="fb-email" 
              name="email" 
              placeholder="din.epost@eksempel.no"
              class="w-full px-3.5 py-2 rounded-xl bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs font-mono placeholder-zinc-600 transition"
            >
          </div>

          <!-- Feilmelding om innsending feiler -->
          <div id="feedback-error" class="hidden text-xs text-rose-400 font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/20"></div>

          <!-- Handlingsknapper -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeFeedbackModal()" class="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-xs font-mono text-zinc-300 transition cursor-pointer">
              Avbryt
            </button>
            <button type="submit" id="fb-submit-btn" class="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-syne font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md">
              <span>Send inn rapport &rarr;</span>
            </button>
          </div>
        </form>

        <!-- Sekundær GitHub Issues-lenke -->
        <div class="pt-3 border-t border-white/10 text-center text-xs font-mono text-zinc-500">
          Har du en GitHub-konto? 
          <a id="fb-github-link" href="${GITHUB_ISSUES_URL}" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white underline font-semibold transition ml-1">
            Opprett et Issue direkte her &rarr;
          </a>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Lukk ved klikk i bakgrunnen
  const modal = document.getElementById('feedback-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFeedbackModal();
  });

  // Lukk ved Esc-tast
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeFeedbackModal();
    }
  });
}

/* =========================================================================
   3. APNE & LUKKE MODAL + AUTOMATISK DIAGNOSTIKK
   ========================================================================= */
function openFeedbackModal() {
  initFeedbackModal();
  const modal = document.getElementById('feedback-modal');
  const form = document.getElementById('feedback-form');
  const successBox = document.getElementById('feedback-success');
  const errBox = document.getElementById('feedback-error');

  // Tilbakestill tilstand
  form.classList.remove('hidden');
  successBox.classList.add('hidden');
  errBox.classList.add('hidden');
  document.getElementById('fb-submit-btn').disabled = false;
  document.getElementById('fb-submit-btn').innerHTML = '<span>Send inn rapport &rarr;</span>';

  // Fyll automatiske tekniske diagnosefelter
  document.getElementById('fb-page-url').value = window.location.href;
  document.getElementById('fb-user-agent').value = navigator.userAgent;
  document.getElementById('fb-screen-size').value = `${window.innerWidth}x${window.innerHeight} (pixelRatio: ${window.devicePixelRatio || 1})`;
  document.getElementById('fb-timestamp').value = new Date().toLocaleString('no-NO');

  // Oppdater forhåndsutfylt GitHub-lenke med nåværende side
  const pagePath = window.location.pathname.split('/').pop() || 'index.html';
  const ghLink = document.getElementById('fb-github-link');
  if (ghLink) {
    const encodedTitle = encodeURIComponent(`[Feilrapport] Problem på ${pagePath}`);
    const encodedBody = encodeURIComponent(`### Beskrivelse av feilen\n\n\n---\n**Teknisk info:**\n- Side: ${window.location.href}\n- Nettleser: ${navigator.userAgent}\n- Skjerm: ${window.innerWidth}x${window.innerHeight}`);
    ghLink.href = `${GITHUB_ISSUES_URL}?title=${encodedTitle}&body=${encodedBody}`;
  }

  modal.classList.remove('hidden');
  setTimeout(() => {
    const msgField = document.getElementById('fb-message');
    if (msgField) msgField.focus();
  }, 100);
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.add('hidden');
}

/* =========================================================================
   4. AJAX INNSENDING VIA WEB3FORMS (SPAM-SIKKER & SERVERLØS)
   ========================================================================= */
async function submitFeedbackForm(e) {
  e.preventDefault();
  const form = document.getElementById('feedback-form');
  const submitBtn = document.getElementById('fb-submit-btn');
  const errBox = document.getElementById('feedback-error');
  const successBox = document.getElementById('feedback-success');

  errBox.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
    <span>Sender...</span>
  `;

  const formData = new FormData(form);
  formData.set('access_key', FORM_ACCESS_KEY);

  // Sjekk om FORM_ACCESS_KEY er uendret demo-nøkkel
  if (FORM_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    // Elegant demo / fallback når nøkkelen ikke er konfigurert ennå
    setTimeout(() => {
      submitBtn.disabled = false;
      form.classList.add('hidden');
      successBox.classList.remove('hidden');
      form.reset();
      console.info('Feedback mottatt lokalt (demo-modus).');
    }, 600);
    return;
  }

  try {
    // Web3Forms bruker standard multipart FormData (uten manuell Content-Type for å unngå CORS-feil)
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      form.classList.add('hidden');
      successBox.classList.remove('hidden');
      form.reset();
    } else {
      errBox.textContent = result.message || 'Kunne ikke sende feilrapporten. Prøv igjen eller bruk GitHub Issues.';
      errBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Prøv igjen &rarr;</span>';
    }
  } catch (err) {
    errBox.textContent = 'Nettverksfeil ved innsending. Sjekk internettforbindelsen din eller bruk GitHub-lenken.';
    errBox.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Prøv igjen &rarr;</span>';
  }
}

// Initialiser når DOM er klar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeedbackModal);
} else {
  initFeedbackModal();
}
