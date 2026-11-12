/**
 * Tailwind-oppsett for hovednettsiden (index.html, galleri.html, changelog.html).
 * Verktøyene (quiz, qr, tabell, events, fpl, eliteserien) har egne oppsett og berøres ikke.
 * Bygg etter endringer i klasser: npm run build:css
 */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './galleri.html',
    './changelog.html',
    './assets/layout.js',
    './assets/main.js',
    './assets/feedback.js',
    './assets/galleri.js',
    './assets/vipps.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['monospace']
      }
    }
  }
};
