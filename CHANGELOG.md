# Changelog

Alle merkbare endringer for prosjektet [Ranheim Kraft](https://ranheimkraft.no) dokumenteres i denne filen.

Formatet er basert på [Keep a Changelog](https://keepachangelog.com/no/1.0.0/), og prosjektet følger [Semantic Versioning](https://semver.org/spec/v2.0.0.html) og [Conventional Commits](https://www.conventionalcommits.org/).

---

## [1.4.0] - 2026-10-25

### Lagt til
- **Changelog-side (`changelog.html`)**: Dedikert endringslogg-side designet i full mørk glassmorphism-stil med interaktiv tidslinje, versjonsmerker og filter over oppdateringer.
- **Bunnmenylenker**: Lagt til direkte lenke til `Changelog` i footeren på `index.html` og `galleri.html`.
- **`.gitignore`**: Etablert omfattende gitignore-fil for å hindre uønsket sporing av `.env`, hemmeligheter, Python-artefakter, OS-filer og midlertidige test-screenshots.
- **`CHANGELOG.md`**: Opprettet prosjektets offisielle endringslogg.

---

## [1.3.0] - 2026-10-25

### Endret
- **Nyhetsticker i hel Ranheim-gradient**: Heldekkende dyp Ranheimsblå gradient (`#071330` til `#0f2766`) med matchende kant-fades og subtil cyan-glød.
- **Raskere scrolling**: Ticker-hastighet økt fra 50s til 22s på desktop, og fra 40s til 16s på mobil.
- **Kompakt mobilvisning**: Redusert vertikal padding og skriftstørrelse for tickeren på mobiltelefoner.
- **Forenklet ticker-badge**: Erstattet bilde-logo med en ren, skarp `SISTE NYTT`-tekstbadge i Ranheimsfarger.
- **Strukturering av assets**: Alle bilder, logoer og ikoner samlet i felles `/assets/`-mappe; overflødige duplikater i rotmappen fjernet.
- **Header & Hero**: Fjernet «Ta kontakt»-knappen fra toppen (beholdt i bunnmenyen) og fjernet prosjektpillen fra hero-seksjonen.

### Lagt til
- **Fersk nyhetsfeed (`assets/news.json`)**: Lagt til klientside-skript (`loadLiveNews()`) og JSON-feed med siste nyhetssaker fra Ranheim Fotball.
- **Flere bakgrunnstags**: Beriket bakgrunnen med autentiske street-art graffiti-tags for `RANHEIM`, `KRAFT`, `KK` og `RANHEIM GERILJA` i *Sedgwick Ave Display*.
- **Fane-tittel & Favicon**: Satt offisiell tittel til `RanheimKraft` og integrert `assets/polarICON.ico`.

### Fjernet
- Blinkende cyan-puls (`animate-pulse`) på nyhetstickeren.
- RIL-logobilde i tickeren.

---

## [1.2.0] - 2026-10-25

### Lagt til
- **Passordbeskyttet Bildegalleri (`galleri.html`)**: Ny underside for visning av kamp- og lagbilder koblet direkte mot Google Disk.
- **Flere mapper med egne passord**: Støtte for unike passord per album (f.eks. Ranheim vs Bryne, Ranheim Gatelag).
- **Lightbox & ZIP-nedlasting**: Fullskjerms bildevisning med berøringssveip og mulighet for å laste ned hele mapper samlet i én ZIP-fil.
- **Google Apps Script Backend (`apps-script/Code.gs`)**: Dørvakt-skript for sikker passordverifisering og generering av forhåndsvisninger/ZIP uten API-nøkler i frontend.

---

## [1.1.0] - 2026-10-24

### Lagt til
- **YouTube Promo Spotlight**: Integrert YouTube-videospiller for `@RanheimGeriljaTV` med terningknapp for å trekke tilfeldige videoer fra arkivet.
- **MatchPic Culler & Renamer**: Fremhevet som prosjekt [ 01 ] på forsiden med lenke til GitHub.

### Endret
- **Mobil-først ytelsesløft**: Deaktivert tung `backdrop-blur` på telefoner til fordel for lett, solid fargetone for å forhindre hakking.
- **Sveipbar filtermeny**: Kategoriknapper på mobil er nå horisontalt sveipbare uten synlig rullefelt (`no-scrollbar`).
- **Berøringsvennlige knapper**: Sikret minimum 44px trykkflater og lagt til safe-area-padding for nyere smarttelefoner.

---

## [1.0.0] - 2026-10-23

### Lagt til
- **Offisiell lansering av ranheimkraft.no**: Sentral hub og landingsside for prosjekter, kode og eksperimenter.
- **Visuell identitet**: Mørk glassmorphism, anamorphic lens flares, comic halftone-mønster og street-art graffititypografi.
- **Live Sports News Ticker**: Rullende nyhetslinje med offisielle nyheter fra Ranheim Fotball.
- **Bento-grid arkitektur**: Prosjektkort med kategorifiltrering for Web Apps, Labs & AI og Kunst/Design.
