# Ranheim Kraft (ranheimkraft.no)

Offisiell portal og samlingssted for **Ranheim Kraft** – uavhengig medieproduksjon, arrangementsgallerier og spesialiserte fotballberegninger fra fjæra.

* **Offisiell nettside:** [https://ranheimkraft.no/](https://ranheimkraft.no/)
* **GitHub Pages:** [https://ranheimgeriljatv.github.io/ranheimkraft.no/](https://ranheimgeriljatv.github.io/ranheimkraft.no/)
* **GitHub Organisasjon:** [RanheimGeriljaTV](https://github.com/RanheimGeriljaTV)

---

## 🧭 Innhold og seksjoner

* **[Hovedside](https://ranheimkraft.no/) (`index.html`)**: Sentral hub bygget i avant-garde Swiss Kinetic-design, med isbjørn-maskot, integrert YouTube-kino for `@RanheimGeriljaTV` med tilfeldig terning-velger, og hurtiginnganger.
* **[Quiz Kraft](https://ranheimkraft.no/quiz.html) (`quiz.html`)**: Interaktivt regneark og poengtavle for quizkvelder. Rask inntasting av lag/runder, universell utforming, seniorvennlig projektorvisning, A+/A- skriftstørrelse, sanntidssummering, nedtellingstimer med lyd, rundeanalyse med grafer, vinnerkonfetti, automatisk lagring, tie-breaker og 3-arks offline Excel-eksport (.xlsx).
* **[QR Kraft](https://ranheimkraft.no/qr.html) (`qr.html`)**: Gratis, reklamefri og avansert QR-kodegenerator for nettsider, WiFi og vCard med egne gradienter, logoer og mønstre. 100 % lokalt og privat.
* **[Tabell Kraft](https://ranheimkraft.no/tabell/) (`tabell/index.html` & `tipping/`)**: Interaktiv OBOS Tabell-tipper & Gamification Hub 2026 med FUT-spillerkort, NFF-kvalik, XP-stige, 4 poengsystemer, sesonglås, Supabase-synk og flersidig Excel-eksport.
* **[TRD Events](https://ranheimkraft.no/events/) (`events/index.html` & `trd.html`)**: Sanntids arrangementsguide for Trondheim med konserter, sport, teater, kultur, bydelsfiltre, «Ut i kveld etter 19» og Trondheims-ruletten.
* **[Kraft-Fryer](https://ranheimkraft.no/airfryer/) (`airfryer/`)**: Stekeovn til airfryer-kalkulator. Gjør om temperatur og tid i sanntid, med hurtigvalg for pommes frites, kylling, laks, pizza og rotgrønnsaker, og nedtellingsklokke med varsel når maten skal ristes og er ferdig. Bygges i [RanheimGeriljaTV/Kraft-Fryer](https://github.com/RanheimGeriljaTV/Kraft-Fryer) og synkes inn fra grenen `build` (ikke rediger filene i `airfryer/` her).
* **[Bildegalleri](https://ranheimkraft.no/galleri.html) (`galleri.html`)**: Arrangements- og oppdragsgalleri for foto, turer og prosjekter. Bildene vises i full oppløsning med fullskjerm-lightbox, touch-sveip på mobil og samlet ZIP-nedlasting.
* **[Eliteserien Fantasy Hub](https://ranheimkraft.no/eliteserien.html) (`eliteserien.html`)**: Matematisk troppsoptimalisering for Eliteserien Fantasy med automatisk overgangsberegning og sanntidslivedashbord.
* **[Premier League FPL Hub](https://ranheimkraft.no/fpl.html) (`fpl.html`)**: Matematisk optimaliseringsverktøy for Fantasy Premier League med terminlisteberegning og spilleranalyser.
* **[Endringslogg](https://ranheimkraft.no/changelog.html) (`changelog.html`)**: Fullstendig tidslinje over versjoner, forbedringer og funksjoner.
* **Vipps Boks (`assets/vipps.js`)**: Frivillig støttefunksjon basert på Vipps Boks for privatpersoner (boksnummer `3153MT`).
* **Feilrapportering (`assets/feedback.js`)**: Spam-sikker og serverløs feilrapporterings-modal via Web3Forms med automatisk feilsøkingsinfo.
* **Auto-Sync (`.github/workflows/sync-subprojects.yml` & `scripts/sync_subprojects.py`)**: Automatisk skysynkronisering mot oppstrømsrepoer (Quiz-Kraft, QR-Kraft, Kraft-Tabell-tips, TRD-Live og Kraft-Fryer) hver 3. time, ved ett klikk, eller via `repository_dispatch` (f.eks. `fryer-updated`). Kjør ett prosjekt lokalt med `python scripts/sync_subprojects.py --project fryer`.

---

## 🎨 Design & Teknologi

* **Swiss Kinetic Formspråk:** Krystallklart, monokromt uttrykk med `Syne` (display) og `Plus Jakarta Sans` (brødtekst).
* **Mobil-først:** Full støtte for iOS Safari (inkl. notch og safe-area-insets) samt Android Chrome og Firefox uten horisontal skrolling.
* **Personvern & Sikkerhet:**
  * Cookiefri, GDPR-vennlig besøksstatistikk via Umami Analytics.
  * Ingen sensitive API-nøkler eller passord i frontend.
  * Sikker ekstern lenkehåndtering med `rel="noopener noreferrer"`.

---

## 📁 Filstruktur

```text
ranheimkraft.no/
├── .github/workflows/
│   └── sync-subprojects.yml     # GitHub Actions tidsplan og manuell synk
├── airfryer/                    # Kraft-Fryer (synket fra Kraft-Fryer, gren build)
├── assets/                      # Ressurser, media, stiler og skript
│   ├── quiz/                    # Quiz Kraft komponenter
│   │   ├── style.css            # Tabell, regneark og temaer
│   │   ├── print.css            # Utskriftstilpasset A4-layout
│   │   ├── scoring.js           # Desimaltolking og tie-breaker
│   │   ├── spreadsheet.js       # Tabellmotor og tastaturnavigasjon
│   │   ├── storage.js           # localStorage, import/eksport og angre
│   │   ├── round-analysis.js    # Rundeanalyse og poenggrafer
│   │   ├── confetti.js          # Vinnerkonfetti-animasjon
│   │   ├── excel-export.js      # 3-arks Excel-eksport (.xlsx)
│   │   ├── app.js               # Initialisering, modaler og kontroller
│   │   ├── exceljs.min.js       # ExcelJS offline bibliotek for formaterte regneark
│   │   └── xlsx.full.min.js     # SheetJS offline Excel-bibliotek
│   ├── feedback.js              # Serverløst tilbakemeldingsskjema
│   ├── logo.png                 # Isbjørn-maskot (våken)
│   ├── logosove.png             # Isbjørn-maskot (sovende)
│   ├── polarICON.ico            # Favicon
│   ├── style.css                # Felles stilark og typografi
│   ├── main.js                  # YouTube Cinema API og mediespiller
│   └── vipps.js                 # Sentral Vipps Boks-komponent
├── scripts/
│   └── sync_subprojects.py      # Synkroniseringsmotor for underprosjekter
├── changelog.html               # Endringslogg (Swiss Kinetic)
├── eliteserien.html             # Eliteserien Fantasy Hub
├── fpl.html                     # Premier League FPL Hub
├── galleri.html                 # Bildegalleri
├── index.html                   # Hovedside
├── qr.html                      # QR Kraft generator
├── quiz.html                    # Quiz Kraft regneark og poengtavle
├── quiz/index.html              # Omdirigering til /quiz.html
├── CHANGELOG.md                 # Versjonsdokumentasjon (Keep a Changelog)
└── README.md                    # Prosjektdokumentasjon
```

---

## 💻 Lokalt oppsett

For lokal testing uten eksterne avhengigheter:

```bash
# Python innebygd webserver
python -m http.server 8000
```

Åpne [http://localhost:8000](http://localhost:8000) i nettleseren.

### CSS for hovednettsiden

Forsiden, galleriet og changelog bruker en ferdigbygd Tailwind-fil (`assets/site.css`). Etter endringer i Tailwind-klasser i `index.html`, `galleri.html`, `changelog.html` eller `assets/*.js`:

```bash
npm install
npm run build:css
```

Commit den oppdaterte `assets/site.css`. Meny og bunntekst for de tre sidene ligger i `assets/layout.js`.
