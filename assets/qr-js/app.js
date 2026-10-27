/**
 * QR Kraft – Hovedapplikasjon (UI & Hendelser)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialiser QR-motor
  const engine = new QREngine('qr-preview');

  // 2. Initialiser Vipps-komponent
  if (window.RanheimVipps) {
    window.RanheimVipps.renderVippsWidget('vipps-widget');
    updateExpiryDateDisplay();
  }

  // 3. Tab-håndtering (URL, WiFi, vCard)
  let activeTab = 'url';
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = {
    url: document.getElementById('panel-url'),
    wifi: document.getElementById('panel-wifi'),
    vcard: document.getElementById('panel-vcard')
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      activeTab = target;

      tabBtns.forEach(b => {
        b.classList.remove('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-400/30');
        b.classList.add('text-zinc-400', 'border-transparent');
      });
      btn.classList.add('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-400/30');
      btn.classList.remove('text-zinc-400', 'border-transparent');

      Object.keys(tabPanels).forEach(key => {
        if (key === target) {
          tabPanels[key].classList.remove('hidden');
        } else {
          tabPanels[key].classList.add('hidden');
        }
      });

      syncContentData();
    });
  });

  // Debounce hjelpefunksjon
  function debounce(func, wait = 40) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const debouncedUpdate = debounce(() => engine.update(), 50);

  // 4. Data-synkronisering basert på aktiv fane
  function syncContentData() {
    let qrData = '';

    if (activeTab === 'url') {
      const urlInput = document.getElementById('input-url').value.trim();
      const redirectToggle = document.getElementById('toggle-redirect');
      
      if (!urlInput) {
        qrData = 'https://ranheimkraft.no';
      } else {
        let finalUrl = urlInput;
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = 'https://' + finalUrl;
        }

        // Hvis tidsbegrenset ranheimkraft-omdirigering er aktivert
        if (redirectToggle && redirectToggle.checked) {
          const expiryInfo = window.RanheimVipps.calculateExpiryDate(6);
          qrData = `https://ranheimkraft.no/go/?target=${encodeURIComponent(finalUrl)}&exp=${expiryInfo.timestamp}`;
        } else {
          qrData = finalUrl;
        }
      }
    } else if (activeTab === 'wifi') {
      const ssid = document.getElementById('wifi-ssid').value.trim() || 'Mitt-WiFi';
      const password = document.getElementById('wifi-password').value || '';
      const encryption = document.getElementById('wifi-encryption').value || 'WPA';
      const isHidden = document.getElementById('wifi-hidden').checked;

      // WIFI:T:WPA;S:Nettverksnavn;P:Passord;H:true;;
      let wifiStr = `WIFI:T:${encryption};S:${escapeWifiString(ssid)};`;
      if (encryption !== 'nopass') {
        wifiStr += `P:${escapeWifiString(password)};`;
      }
      if (isHidden) {
        wifiStr += `H:true;`;
      }
      wifiStr += `;`;
      qrData = wifiStr;
    } else if (activeTab === 'vcard') {
      const firstName = document.getElementById('vcard-firstname').value.trim() || 'Ola';
      const lastName = document.getElementById('vcard-lastname').value.trim() || 'Nordmann';
      const phone = document.getElementById('vcard-phone').value.trim();
      const email = document.getElementById('vcard-email').value.trim();
      const org = document.getElementById('vcard-org').value.trim();
      const title = document.getElementById('vcard-title').value.trim();
      const website = document.getElementById('vcard-url').value.trim();

      qrData = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${firstName} ${lastName}`,
        org ? `ORG:${org}` : '',
        title ? `TITLE:${title}` : '',
        phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
        email ? `EMAIL;TYPE=PREF,INTERNET:${email}` : '',
        website ? `URL:${/^https?:\/\//i.test(website) ? website : 'https://' + website}` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n');
    }

    engine.state.data = qrData;
    debouncedUpdate();
  }

  function escapeWifiString(str) {
    return str.replace(/([\\;,:"])/g, '\\$1');
  }

  // Lytt på innhold-inputs
  const contentInputs = [
    'input-url', 'toggle-redirect',
    'wifi-ssid', 'wifi-password', 'wifi-encryption', 'wifi-hidden',
    'vcard-firstname', 'vcard-lastname', 'vcard-phone', 'vcard-email', 'vcard-org', 'vcard-title', 'vcard-url'
  ];

  contentInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', syncContentData);
      el.addEventListener('change', syncContentData);
    }
  });

  // Vis/skjul passord i WiFi
  const togglePassBtn = document.getElementById('btn-toggle-password');
  const passInput = document.getElementById('wifi-password');
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? 'Skjul' : 'Vis';
    });
  }

  // 5. Fargevalg (Solid vs Gradient)
  const colorTypeRadios = document.querySelectorAll('input[name="color-type"]');
  const solidControls = document.getElementById('solid-controls');
  const gradientControls = document.getElementById('gradient-controls');

  colorTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      engine.state.colorType = val;
      if (val === 'solid') {
        solidControls.classList.remove('hidden');
        gradientControls.classList.add('hidden');
      } else {
        solidControls.classList.add('hidden');
        gradientControls.classList.remove('hidden');
      }
      debouncedUpdate();
    });
  });

  // Solid fargevelger
  const solidColorPicker = document.getElementById('solid-color');
  const solidColorHex = document.getElementById('solid-color-hex');
  if (solidColorPicker && solidColorHex) {
    solidColorPicker.addEventListener('input', (e) => {
      solidColorHex.value = e.target.value;
      engine.state.solidColor = e.target.value;
      debouncedUpdate();
    });
    solidColorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        solidColorPicker.value = e.target.value;
        engine.state.solidColor = e.target.value;
        debouncedUpdate();
      }
    });
  }

  // Gradient kontroller
  const gradTypeSelect = document.getElementById('gradient-type');
  const gradStartPicker = document.getElementById('gradient-start');
  const gradStartHex = document.getElementById('gradient-start-hex');
  const gradEndPicker = document.getElementById('gradient-end');
  const gradEndHex = document.getElementById('gradient-end-hex');
  const gradRotation = document.getElementById('gradient-rotation');
  const gradRotationVal = document.getElementById('gradient-rotation-val');

  if (gradTypeSelect) {
    gradTypeSelect.addEventListener('change', (e) => {
      engine.state.gradientType = e.target.value;
      debouncedUpdate();
    });
  }

  if (gradStartPicker && gradStartHex) {
    gradStartPicker.addEventListener('input', (e) => {
      gradStartHex.value = e.target.value;
      engine.state.gradientStart = e.target.value;
      debouncedUpdate();
    });
  }

  if (gradEndPicker && gradEndHex) {
    gradEndPicker.addEventListener('input', (e) => {
      gradEndHex.value = e.target.value;
      engine.state.gradientEnd = e.target.value;
      debouncedUpdate();
    });
  }

  if (gradRotation && gradRotationVal) {
    gradRotation.addEventListener('input', (e) => {
      gradRotationVal.textContent = `${e.target.value}°`;
      engine.state.gradientRotation = parseInt(e.target.value, 10);
      debouncedUpdate();
    });
  }

  // 6. Bakgrunnsfarge og Transparens
  const bgColorPicker = document.getElementById('bg-color');
  const bgTransparentCheck = document.getElementById('bg-transparent');
  const previewWrapper = document.getElementById('qr-preview-wrapper');

  if (bgColorPicker) {
    bgColorPicker.addEventListener('input', (e) => {
      engine.state.bgColor = e.target.value;
      if (!engine.state.bgTransparent) {
        debouncedUpdate();
      }
    });
  }

  if (bgTransparentCheck) {
    bgTransparentCheck.addEventListener('change', (e) => {
      const isTransparent = e.target.checked;
      engine.state.bgTransparent = isTransparent;
      if (previewWrapper) {
        previewWrapper.classList.toggle('transparent-bg', isTransparent);
      }
      debouncedUpdate();
    });
  }

  // 7. Form på prikkene (Dots Style)
  const dotsTypeSelect = document.getElementById('dots-style');
  if (dotsTypeSelect) {
    dotsTypeSelect.addEventListener('change', (e) => {
      engine.state.dotsType = e.target.value;
      debouncedUpdate();
    });
  }

  // 8. Hjørne-øyne (Corners Square & Corner Dots)
  const cornerSquareShape = document.getElementById('corners-square-shape');
  const cornerSquareColor = document.getElementById('corners-square-color');
  const cornerSquareCustom = document.getElementById('corners-square-custom');

  const cornerDotShape = document.getElementById('corners-dot-shape');
  const cornerDotColor = document.getElementById('corners-dot-color');
  const cornerDotCustom = document.getElementById('corners-dot-custom');

  if (cornerSquareShape) {
    cornerSquareShape.addEventListener('change', (e) => {
      engine.state.cornersSquareType = e.target.value;
      debouncedUpdate();
    });
  }

  if (cornerSquareCustom && cornerSquareColor) {
    cornerSquareCustom.addEventListener('change', (e) => {
      engine.state.cornersSquareCustom = e.target.checked;
      cornerSquareColor.disabled = !e.target.checked;
      cornerSquareColor.parentElement.classList.toggle('opacity-50', !e.target.checked);
      debouncedUpdate();
    });
    cornerSquareColor.addEventListener('input', (e) => {
      engine.state.cornersSquareColor = e.target.value;
      debouncedUpdate();
    });
  }

  if (cornerDotShape) {
    cornerDotShape.addEventListener('change', (e) => {
      engine.state.cornersDotType = e.target.value;
      debouncedUpdate();
    });
  }

  if (cornerDotCustom && cornerDotColor) {
    cornerDotCustom.addEventListener('change', (e) => {
      engine.state.cornersDotCustom = e.target.checked;
      cornerDotColor.disabled = !e.target.checked;
      cornerDotColor.parentElement.classList.toggle('opacity-50', !e.target.checked);
      debouncedUpdate();
    });
    cornerDotColor.addEventListener('input', (e) => {
      engine.state.cornersDotColor = e.target.value;
      debouncedUpdate();
    });
  }

  // 9. Hurtigvalg / Presets
  const presetButtons = document.querySelectorAll('.preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const applied = engine.applyPreset(presetKey);
      if (applied) {
        syncUIFromState();
        showToast(`Fargetema "${btn.textContent.trim()}" aktivert`);
      }
    });
  });

  function syncUIFromState() {
    // Synkroniser radiobuttons
    const radio = document.querySelector(`input[name="color-type"][value="${engine.state.colorType}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    }

    if (solidColorPicker) solidColorPicker.value = engine.state.solidColor;
    if (solidColorHex) solidColorHex.value = engine.state.solidColor;
    if (gradTypeSelect) gradTypeSelect.value = engine.state.gradientType;
    if (gradStartPicker) gradStartPicker.value = engine.state.gradientStart;
    if (gradStartHex) gradStartHex.value = engine.state.gradientStart;
    if (gradEndPicker) gradEndPicker.value = engine.state.gradientEnd;
    if (gradEndHex) gradEndHex.value = engine.state.gradientEnd;
    if (gradRotation) gradRotation.value = engine.state.gradientRotation;
    if (gradRotationVal) gradRotationVal.textContent = `${engine.state.gradientRotation}°`;

    if (dotsTypeSelect) dotsTypeSelect.value = engine.state.dotsType;
    if (cornerSquareShape) cornerSquareShape.value = engine.state.cornersSquareType;
    if (cornerSquareColor && engine.state.cornersSquareColor) cornerSquareColor.value = engine.state.cornersSquareColor;
    if (cornerDotShape) cornerDotShape.value = engine.state.cornersDotType;
    if (cornerDotColor && engine.state.cornersDotColor) cornerDotColor.value = engine.state.cornersDotColor;
  }

  // 10. Logo-innstillinger
  const logoFileInput = document.getElementById('logo-file');
  const removeLogoBtn = document.getElementById('btn-remove-logo');
  const logoSizeSlider = document.getElementById('logo-size');
  const logoSizeVal = document.getElementById('logo-size-val');
  const logoPaddingSlider = document.getElementById('logo-padding');
  const logoPaddingVal = document.getElementById('logo-padding-val');
  const hideBgDotsCheck = document.getElementById('hide-bg-dots');
  const cropButtons = document.querySelectorAll('.crop-btn');

  let currentCrop = 'original';

  if (logoFileInput) {
    logoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await engine.processLogo(file, currentCrop);
        if (removeLogoBtn) removeLogoBtn.classList.remove('hidden');
        showToast('Logo lastet opp');
      }
    });
  }

  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', () => {
      engine.removeLogo();
      if (logoFileInput) logoFileInput.value = '';
      removeLogoBtn.classList.add('hidden');
      showToast('Logo fjernet');
    });
  }

  cropButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const crop = btn.dataset.crop;
      currentCrop = crop;

      cropButtons.forEach(b => {
        b.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-400/40');
        b.classList.add('bg-white/[0.04]', 'text-zinc-400', 'border-white/10');
      });
      btn.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-400/40');
      btn.classList.remove('bg-white/[0.04]', 'text-zinc-400', 'border-white/10');

      await engine.applyLogoCrop(crop);
    });
  });

  if (logoSizeSlider && logoSizeVal) {
    logoSizeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      logoSizeVal.textContent = `${Math.round(val * 100)} %`;
      engine.state.logoSize = val;
      debouncedUpdate();
    });
  }

  if (logoPaddingSlider && logoPaddingVal) {
    logoPaddingSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      logoPaddingVal.textContent = `${val} px`;
      engine.state.logoMargin = val;
      debouncedUpdate();
    });
  }

  if (hideBgDotsCheck) {
    hideBgDotsCheck.addEventListener('change', (e) => {
      engine.state.hideBackgroundDots = e.target.checked;
      debouncedUpdate();
    });
  }

  // 11. Eksport & Nedlasting
  const resolutionSelect = document.getElementById('export-resolution');
  if (resolutionSelect) {
    resolutionSelect.addEventListener('change', (e) => {
      engine.state.exportResolution = parseInt(e.target.value, 10);
    });
  }

  const downloadPngBtn = document.getElementById('btn-download-png');
  const downloadSvgBtn = document.getElementById('btn-download-svg');
  const downloadWebpBtn = document.getElementById('btn-download-webp');
  const mobileDownloadBtn = document.getElementById('mobile-download-btn');

  async function triggerDownload(format) {
    try {
      showToast(`Genererer ${format.toUpperCase()} (${engine.state.exportResolution}px)...`);
      await engine.download(format, 'qr-kraft');
      showToast(`${format.toUpperCase()} lastet ned!`);
    } catch (err) {
      console.error(err);
      showToast('Feil under generering av bilde.');
    }
  }

  if (downloadPngBtn) downloadPngBtn.addEventListener('click', () => triggerDownload('png'));
  if (downloadSvgBtn) downloadSvgBtn.addEventListener('click', () => triggerDownload('svg'));
  if (downloadWebpBtn) downloadWebpBtn.addEventListener('click', () => triggerDownload('webp'));
  if (mobileDownloadBtn) mobileDownloadBtn.addEventListener('click', () => triggerDownload('png'));

  // 12. Oppdater utløpsdatoviser
  function updateExpiryDateDisplay() {
    const expiryEl = document.getElementById('expiry-date-badge');
    if (expiryEl && window.RanheimVipps) {
      const info = window.RanheimVipps.calculateExpiryDate(6);
      expiryEl.textContent = info.dateString;
    }
  }

  // 13. Toast Varslingssystem
  function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-zinc-900 border border-white/20 text-white text-xs font-mono shadow-2xl z-50 transition-all duration-300 pointer-events-none opacity-0 translate-y-2';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-2');
    }, 2400);
  }

  // Første rendering
  syncContentData();
});
