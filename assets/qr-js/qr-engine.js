/**
 * QR Kraft – QR Engine Wrapper
 * Håndterer instansiering, live styling og eksport via qr-code-styling
 */

class QREngine {
  constructor(previewContainerId) {
    this.container = document.getElementById(previewContainerId);
    this.rawLogoDataUrl = null;
    this.processedLogoDataUrl = null;
    
    // Standard tilstand
    this.state = {
      data: 'https://ranheimkraft.no',
      dotsType: 'extra-rounded',
      colorType: 'gradient', // 'solid' eller 'gradient'
      solidColor: '#004b93',
      gradientType: 'linear', // 'linear' eller 'radial'
      gradientStart: '#00f0ff',
      gradientEnd: '#004b93',
      gradientRotation: 45, // grader
      bgColor: '#ffffff',
      bgTransparent: false,
      cornersSquareType: 'extra-rounded',
      cornersSquareColor: '#00f0ff',
      cornersSquareCustom: true,
      cornersDotType: 'dot',
      cornersDotColor: '#004b93',
      cornersDotCustom: true,
      logoSize: 0.22,
      logoMargin: 4,
      logoCrop: 'original', // 'original', 'rounded', 'circle'
      hideBackgroundDots: true,
      exportResolution: 1024 // 1024 eller 2048
    };

    this.qrCode = null;
    this.init();
  }

  init() {
    if (typeof QRCodeStyling === 'undefined') {
      console.error('QRCodeStyling biblioteket er ikke lastet inn.');
      return;
    }

    const options = this.buildOptions(320); // 320px for forhåndsvisning
    this.qrCode = new QRCodeStyling(options);
    if (this.container) {
      this.container.innerHTML = '';
      this.qrCode.append(this.container);
    }
  }

  /**
   * Bygger konfigurasjonsobjekt for QRCodeStyling
   */
  buildOptions(size = 320) {
    // 1. Dots options
    const dotsOptions = {
      type: this.state.dotsType
    };

    if (this.state.colorType === 'solid') {
      dotsOptions.color = this.state.solidColor;
    } else {
      dotsOptions.gradient = {
        type: this.state.gradientType,
        rotation: (this.state.gradientRotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: this.state.gradientStart },
          { offset: 1, color: this.state.gradientEnd }
        ]
      };
    }

    // 2. Background options
    const backgroundOptions = {
      color: this.state.bgTransparent ? 'transparent' : this.state.bgColor
    };

    // 3. Corners Square
    const cornersSquareOptions = {
      type: this.state.cornersSquareType
    };
    if (this.state.cornersSquareCustom && this.state.cornersSquareColor) {
      cornersSquareOptions.color = this.state.cornersSquareColor;
    } else if (this.state.colorType === 'solid') {
      cornersSquareOptions.color = this.state.solidColor;
    }

    // 4. Corners Dot
    const cornersDotOptions = {
      type: this.state.cornersDotType
    };
    if (this.state.cornersDotCustom && this.state.cornersDotColor) {
      cornersDotOptions.color = this.state.cornersDotColor;
    } else if (this.state.colorType === 'solid') {
      cornersDotOptions.color = this.state.solidColor;
    }

    // 5. Image options
    const imageOptions = {
      hideBackgroundDots: this.state.hideBackgroundDots,
      imageSize: parseFloat(this.state.logoSize),
      margin: parseInt(this.state.logoMargin, 10),
      crossOrigin: 'anonymous'
    };

    return {
      width: size,
      height: size,
      type: 'canvas',
      data: this.state.data,
      image: this.processedLogoDataUrl || undefined,
      dotsOptions,
      backgroundOptions,
      cornersSquareOptions,
      cornersDotOptions,
      imageOptions,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H' // 30 % feilkorrigering alltid på
      }
    };
  }

  /**
   * Oppdaterer QR-koden live
   */
  update() {
    if (!this.qrCode) {
      this.init();
      return;
    }
    const options = this.buildOptions(320);
    this.qrCode.update(options);
  }

  /**
   * Prosesserer opplastet logobilde med formbeskjæring
   */
  async processLogo(file, cropStyle = 'original') {
    if (!file) {
      this.rawLogoDataUrl = null;
      this.processedLogoDataUrl = null;
      this.update();
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        this.rawLogoDataUrl = e.target.result;
        await this.applyLogoCrop(cropStyle);
        resolve(this.processedLogoDataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Beskjærer råbilde til original, avrundet eller sirkulær canvas
   */
  async applyLogoCrop(cropStyle = 'original') {
    this.state.logoCrop = cropStyle;
    if (!this.rawLogoDataUrl) {
      this.processedLogoDataUrl = null;
      this.update();
      return;
    }

    if (cropStyle === 'original') {
      this.processedLogoDataUrl = this.rawLogoDataUrl;
      this.update();
      return;
    }

    const img = new Image();
    img.src = this.rawLogoDataUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = Math.min(img.width, img.height);
    canvas.width = size;
    canvas.height = size;

    // Senter-beskjæring
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;

    ctx.save();
    ctx.beginPath();

    if (cropStyle === 'circle') {
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    } else if (cropStyle === 'rounded') {
      const radius = size * 0.22; // 22 % hjørneradius
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, size, size, radius);
      } else {
        // Fallback for eldre nettlesere
        ctx.arc(radius, radius, radius, Math.PI, Math.PI * 1.5);
        ctx.lineTo(size - radius, 0);
        ctx.arc(size - radius, radius, radius, Math.PI * 1.5, 0);
        ctx.lineTo(size, size - radius);
        ctx.arc(size - radius, size - radius, radius, 0, Math.PI * 0.5);
        ctx.lineTo(radius, size);
        ctx.arc(radius, size - radius, radius, Math.PI * 0.5, Math.PI);
        ctx.closePath();
      }
    }
    ctx.clip();
    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
    ctx.restore();

    this.processedLogoDataUrl = canvas.toDataURL('image/png');
    this.update();
  }

  /**
   * Fjerner logo
   */
  removeLogo() {
    this.rawLogoDataUrl = null;
    this.processedLogoDataUrl = null;
    this.update();
  }

  /**
   * Bruk forhåndsdefinert fargetema (Preset)
   */
  applyPreset(presetKey) {
    const presets = {
      ranheim: {
        colorType: 'gradient',
        gradientType: 'linear',
        gradientStart: '#00f0ff',
        gradientEnd: '#004b93',
        gradientRotation: 45,
        dotsType: 'extra-rounded',
        cornersSquareType: 'extra-rounded',
        cornersSquareColor: '#00f0ff',
        cornersSquareCustom: true,
        cornersDotType: 'dot',
        cornersDotColor: '#004b93',
        cornersDotCustom: true,
        bgColor: '#ffffff',
        bgTransparent: false
      },
      sort: {
        colorType: 'solid',
        solidColor: '#08080a',
        dotsType: 'square',
        cornersSquareType: 'square',
        cornersSquareColor: '#08080a',
        cornersSquareCustom: true,
        cornersDotType: 'square',
        cornersDotColor: '#08080a',
        cornersDotCustom: true,
        bgColor: '#ffffff',
        bgTransparent: false
      },
      gull: {
        colorType: 'gradient',
        gradientType: 'linear',
        gradientStart: '#f59e0b',
        gradientEnd: '#b45309',
        gradientRotation: 45,
        dotsType: 'classy',
        cornersSquareType: 'extra-rounded',
        cornersSquareColor: '#f59e0b',
        cornersSquareCustom: true,
        cornersDotType: 'dot',
        cornersDotColor: '#b45309',
        cornersDotCustom: true,
        bgColor: '#ffffff',
        bgTransparent: false
      },
      havblaa: {
        colorType: 'gradient',
        gradientType: 'radial',
        gradientStart: '#06b6d4',
        gradientEnd: '#0284c7',
        gradientRotation: 0,
        dotsType: 'dots',
        cornersSquareType: 'dot',
        cornersSquareColor: '#0284c7',
        cornersSquareCustom: true,
        cornersDotType: 'dot',
        cornersDotColor: '#0891b2',
        cornersDotCustom: true,
        bgColor: '#ffffff',
        bgTransparent: false
      },
      skog: {
        colorType: 'gradient',
        gradientType: 'linear',
        gradientStart: '#10b981',
        gradientEnd: '#047857',
        gradientRotation: 135,
        dotsType: 'rounded',
        cornersSquareType: 'extra-rounded',
        cornersSquareColor: '#059669',
        cornersSquareCustom: true,
        cornersDotType: 'square',
        cornersDotColor: '#047857',
        cornersDotCustom: true,
        bgColor: '#ffffff',
        bgTransparent: false
      }
    };

    if (presets[presetKey]) {
      Object.assign(this.state, presets[presetKey]);
      this.update();
      return presets[presetKey];
    }
    return null;
  }

  /**
   * Laster ned QR-kode i valgt format (png, svg, webp) og oppløsning (1024 eller 2048)
   */
  async download(format = 'png', filename = 'qr-kraft') {
    const resolution = parseInt(this.state.exportResolution, 10) || 1024;

    if (format === 'svg') {
      // For SVG, opprett en dedikert SVG-instans for ren vektor
      const svgOptions = this.buildOptions(resolution);
      svgOptions.type = 'svg';
      const exportQR = new QRCodeStyling(svgOptions);
      await exportQR.download({ name: filename, extension: 'svg' });
      return;
    }

    if (format === 'webp') {
      // For WEBP, tegn til høyoppløst canvas og last ned
      const exportOptions = this.buildOptions(resolution);
      exportOptions.type = 'canvas';
      const exportQR = new QRCodeStyling(exportOptions);
      
      const blob = await exportQR.getRawData('webp');
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback til download metoden
        await exportQR.download({ name: filename, extension: 'webp' });
      }
      return;
    }

    // Standard PNG
    const exportOptions = this.buildOptions(resolution);
    exportOptions.type = 'canvas';
    const exportQR = new QRCodeStyling(exportOptions);
    await exportQR.download({ name: filename, extension: 'png' });
  }
}

window.QREngine = QREngine;
