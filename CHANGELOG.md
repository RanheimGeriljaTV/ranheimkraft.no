# Changelog

Alle merkbare endringer for prosjektet [Ranheim Kraft](https://ranheimkraft.no) dokumenteres i denne filen.

Formatet er basert på [Keep a Changelog](https://keepachangelog.com/no/1.0.0/), og prosjektet følger [Semantic Versioning](https://semver.org/spec/v2.0.0.html) og [Conventional Commits](https://www.conventionalcommits.org/).

---

## [2.5.0] - 2026-10-27

### Lagt til
- **Felles Auto-Sync for subprosjekter (`.github/workflows/sync-subprojects.yml` & `scripts/sync_subprojects.py`)**:
  - Helautomatisk synkronisering av frittstående klientside-verktøy (**Quiz Kraft** og **QR Kraft**) mot deres respektive oppstrømsrepoer.
  - Kjører automatisk hver 6. time (cron `0 */6 * * *`) eller on-demand via «Run workflow» i GitHub Actions.
  - Fremtidssikker arkitektur: Nye prosjekter legges til med noen få linjer i `SUBPROJECTS`-listen.
- **Quiz Kraft integrasjon (`quiz.html` & `assets/quiz/`)**:
  - Fullverdig integrasjon av **Quiz Kraft** – interaktivt regneark og poengtavle for quizkvelder.
  - **Universell & seniorvennlig utforming**: Lys modus som standard med kullsvarte tall og linjer for maksimal lesbarhet på projektor, samt mørk modus for kveldsbelysning.
  - **A+ / A- skriftstørrelsesskalering**: To store knapper for enkel oppskalering av tabellen.
  - **Smart tastaturnavigasjon & halvpoeng**: Trykk Enter / Pil Ned for å hoppe rett til neste lag i samme runde. Støtter både komma og punktum (`8,5` og `8.5`).
  - **Sortering med tie-breaker**: Automatisk rangering etter total poengsum og tie-breaker basert på runderesultater bakover.
  - **Automatisk lagring & filflytting**: `localStorage`-lagring med grønn statuslinje, JSON-eksport/import for å jobbe videre hjemme, og 100 % offline Excel-eksport (.xlsx via SheetJS).
  - **Fullverdig utskrift & PDF**: `print.css` optimalisert for ren liggende A4-utskrift uten knapper og verktøylinjer.
  - **Nettstedsnavigasjon**: Integrert med felles toppmeny, Vipps-støtte (`assets/vipps.js`), feilrapporterings-modal (`assets/feedback.js`) og fremhevet i seksjon 3 på forsiden.

---

## [2.4.0] - 2026-10-27

### Lagt til
- **Serverløs & spam-sikker feilrapportering (`assets/feedback.js`)**:
  - Integrert modal-skjema for feilrapporter og tilbakemeldinger uten behov for egen server.
  - **Trygg for offentlig GitHub**: E-postadresser skjules fullstendig via Web3Forms API og konfigurerbar `FORM_ACCESS_KEY`.
  - **Spam-beskyttelse**: Usynlig honeypot-felt (`botcheck`) blokkerer automatiserte spam-roboter.
  - **Automatisk diagnostikk**: Skjulte felter fanger automatisk opp URL, nettleserinfo og skjermoppløsning for rask feilsøking.
  - **Sekundær GitHub-lenke**: Direkte hurtiglenke til å opprette ferdig utfylt GitHub Issue.
  - **Diskret footer-knapp**: Tilgjengelig på tvers av alle fem sider (`index.html`, `galleri.html`, `changelog.html`, `eliteserien.html` og `fpl.html`).

---

## [2.3.1] - 2026-10-27

### Endret & Sikret
- **Kompakt Hero & Above-the-fold-visning (`index.html`)**: Fjernet unødig fylltekst og strammet inn vertikal avstand slik at videospilleren og innholdet er synlig direkte på skjermen uten skrolling på både mobil og desktop.
- **Navnejustering**: Fjernet punktum fra «RANHEIM KRAFT» i hovedoverskriften for ren merkevaretypografi.
- **Opprydding i dokumentasjon (`README.md` & `apps-script/README.md`)**:
  - Fjernet all omtale av interne databaser, regneark og passordsystemer for å beskytte arkitekturen.
  - Oppdatert prosjektbeskrivelse, komponenter og filstruktur i tråd med Swiss Kinetic.
- **Sikkerhetsherding i `.gitignore`**:
  - Etablert eksplisitte regler mot eksponering av betalings- og Vipps-hemmeligheter (`*vipps*`, `*payment*`, `*merchant*`).
  - Blokkerer API-nøkler, sertifikater, tjenestekontoer og midlertidige testfiler.

---

## [2.3.0] - 2026-10-27

### Lagt til & Forbedret
- **Gjenbrukbar Vipps Boks-komponent (`assets/vipps.js`)**:
  - Etablert sentral Vipps-støttemodul basert på Vipps Boks (boksnummer `3153MT`).
  - Offisiell Vipps-profil: oransje farge (`#ff5b24`), pilleformet knapp med hvit Vipps-logo og -smil.
  - Hjelpetekst under knappen: *"Åpner Vipps direkte på mobil, eller søk opp boks **3153MT** i Vipps."*
  - Integrert på alle sider (`index.html`, `galleri.html`, `changelog.html`, og i bunnlinjen på `eliteserien.html` og `fpl.html`).
- **Swiss Kinetic Changelog (`changelog.html`)**:
  - Full redesign til avant-garde sveitsisk typografi (`Syne` og `Plus Jakarta Sans`).
  - Fjernet halvtone-mønster og linseeffekter for et rent, monokromt uttrykk i tråd med resten av nettstedet.

---

## [2.2.0] - 2026-10-27

### Endret & Forbedret
- **Swiss Kinetic Bildegalleri (\galleri.html\)**:
  - Modernisert hele bildegalleriet til det samme avant-garde sveitsiske designet som forsiden (\Syne\ og \Plus Jakarta Sans\).
  - Fjernet halvtone-mønstre og linse-effekter for et krystallklart, kontrastrikt galleriuttrykk.
  - Bevart full sikker sky-integrasjon mot Google Disk med passordvalidering, modal, fullskjermvisning og samlet ZIP-nedlasting.
- **Hero-oppsett & Logo-plassering (\index.html\)**:
  - Flyttet isbjørnen (\logo.png\) direkte over \RANHEIM KRAFT\-overskriften og hevet overskriften med redusert toppavstand.
  - Fjernet Trondheim- og koordinattekst (\Trondheim • 63.42° N\) fra toppmenyen.
  - Fjernet dekorativt tekstfyll som «UAVHENGIG STUDIOPORTAL • 2026».
- **Fjernet MatchPic Culler**:
  - Fjernet lenke og kort for MatchPic Culler ettersom repositoriet er satt til privat.
  - Seksjon 03 er nå et balansert 2-kolonners rutenett for Eliteserien Fantasy Hub og Premier League FPL.
- **Mobiloptimalisering**:
  - Sikret presis typografiskalering (\	ext-4xl min-[400px]:text-5xl sm:text-7xl md:text-8xl\) og trygg viewport-håndtering på iOS (Safari) og Android (Chrome/Firefox).

---

## [2.1.0] - 2026-10-27

### Endret & Forbedret
- **Nytt radikalt design: «Swiss Kinetic»**:
  - Forlot tradisjonelt bento-rutenett til fordel for et modig, minimalistisk sveitsisk kunstgalleri-oppsett med avant-garde typografi (`Syne 900` og `Plus Jakarta Sans`).
  - **Mascot Hero-banner**: Isbjørnen (`logo.png`) er stolt integrert hvilende over den massive overskriften, med en interaktiv easter-egg som bytter til sovende bjørn (`logosove.png`) ved hover.
  - **Kompakt videospiller**: Nedskalert videospilleren til en velproporsjonert 16:9-kino ved siden av tekstinnholdet i stedet for å dominere hele skjermen.
  - **Fjernet all clutter**: Ingen bakgrunnsgraffiti, ingen halvtone-støy, og null overflødige merkelapper. Krystallklart og tiltalende for vanlige besøkende.

---

## [2.0.1] - 2026-10-26

### Endret & Forbedret
- **Fjernet gyroskop & stabil mobilvisning**:
  - Gyroskop-lytteren (`deviceorientation`) på mobil er fjernet helt for å unngå urolig og forstyrrende vipping av kortene. Mobilvisningen er nå 100% stødig og lynrask.
  - På desktop er 3D-tiltingen tonet kraftig ned til en diskret lysrefleks ved musepeker uten fargesterk regnbuefolie.
- **Fjernet passordinngang på forsiden**:
  - Fjernet passordfeltet fra bildegalleriboksen på forsiden.
  - Erstattet med en ren og informativ liste over galleriets kjernefunksjoner (fullskjermsvisning, 1-klikks samlet ZIP-nedlasting og sikre mapper) som balanserer Bento-boksen harmonisk mot videospilleren.

---

## [2.0.0] - 2026-10-26

### Lagt til
- **3D Holografiske Samlekort (Holo Foil Card)**:
  - Bento-flisene har nå en 3D-samlekorteffekt (`perspective: 1400px`) med en glitrende holografisk regnbuefolie (`.holo-foil`) og lysglans.
  - **Gyroskop på mobil**: Når du snur og vipper på telefonen, reagerer kortene i sanntid via `deviceorientation` i 3D-rommet.
  - **Musepeker-tilt på desktop**: Lysrefleksjonen og 3D-vinklingen følger musepekeren dynamisk over hvert enkelt kort.
- **Klient- & Oppdragshurtiginngang**: Lagt til et diskret passordfelt i bildegalleri-kortet på forsiden. Fyller tomrommet perfekt og lar kunder låse opp sine private oppdrag direkte fra forsiden uten å lekke albumtitler eller klientnavn offentlig.

---

## [1.9.0] - 2026-10-26

### Endret & Refaktorert
- **Modulær arkitektur & filoppdeling**:
  - Opprettet `assets/style.css` som samler all felles styling, glassmorphism-effekter, bakgrunnsgraffiti, animasjoner og skrollefelt.
  - Opprettet `assets/main.js` som inneholder YouTube Cinema Player API-styring, lydkontroll, terningvelger og sanntids RSS-ticker.
  - Slanket `index.html` fra 786 linjer ned til 457 linjer med ren, semantisk HTML.
  - Gjenbruker `assets/style.css` i `galleri.html` og `changelog.html`, og eliminerte over 400 linjer med duplisert CSS og inline-skript.
- **YouTube Cinema Mode**: Autoplay på mute uten forstyrrende YouTube-grensesnitt (tidslinje, pauseknapper og logoer), styrt via en egen tilpasset `🔇 Slå på lyd`-knapp.

---

## [1.8.0] - 2026-10-26

### Lagt til
- **Live Google Disk Bildegalleri**: Koblet `galleri.html` direkte til bildekilden via sikker sky-integrasjon.
- **Sanntids gallerioversikt**: Nettsiden henter nå automatisk oppdaterte album, bildelister, datoer og beskrivelser rett fra bildekilden uten behov for nye kodeoppdateringer.
- **Passordsikkerhet & Referrer Policy**: Bildestrømmen er sikret med `referrerpolicy="no-referrer"` på miniatyrer og lightbox for full kompatibilitet med Google Disk, kombinert med passordbeskyttelse.

---

## [1.7.0] - 2026-10-26

### Lagt til
- **Eliteserien Fantasy Hub (`eliteserien.html`)**: Dedikert side på `ranheimkraft.no` for matematisk troppsoptimering og livedashboard for Eliteserien Fantasy.
- **Hukommelse for Manager ID (`localStorage`)**: Første gang brukeren besøker siden, skriver man inn sin Eliteserien Fantasy ID (eller tester med eksempel-ID). Den lagres automatisk på enheten slik at appen åpner ditt lag umiddelbart ved neste besøk.
- **Mobil-først og Fullskjerm**: Responsivt skall tilpasset mobilskjermer (`viewport-fit=cover`), kildevelger (Sky vs. Lokalhost) og mulighet for fullskjerm.
- **Prosjektkort & Navigasjon**: Lagt til hurtigknapp i toppmenyen og nytt Bento-prosjektkort for Eliteserien Hub på `index.html`.

---

## [1.7.0] - 2026-10-26

### Lagt til
- **Bento Grid Hub-design**: Fullstendig restrukturering av forsiden til et moderne og intuitivt Bento Grid oppdelt i to naturlige etasjer (Media & Opplevelser øverst, Verktøy & Kodelab nederst).
- **Tydelige handlingsknapper (Call-to-Action)**: Hver flis har nå en klar, fullbredde handlingsknapp (`Åpne bildegalleriet 📸`, `Start FPL-kalkulator ⚽`, `Åpne Eliteserien Hub 🇳🇴`, `Se koden på GitHub 💻`).
- **Album-forhåndsvisning på galleriet**: Miniatyrliste over ferske fotoalbum direkte på galleriflisen for å pirre nysgjerrigheten til tilfeldige besøkende.

### Endret
- **Generelt Bildegalleri**: Korrigert galleriet fra å feilaktig omtales som «RIL fotoarkiv» eller «kampbilder» til å være et generelt, passordbeskyttet bildegalleri for arrangementer, turer, prosjekter og diverse fotoalbum. Fjernet Ranheim IL-logo fra galleri-headeren.
- **Forenklet språk for vanlige besøkende**: Fjernet forvirrende fagspråk (som *PuLP MILP solver*, *EXIF*, *FDR*, *OpenCV* og *culling*) fra forsiden til fordel for folkelige og forståelige beskrivelser.
- **Strømlinjeformet hero-seksjon**: Fjernet overflødige duplikate tekstbokser til fordel for en ren og innbydende intro-stripe.

---

## [1.6.0] - 2026-10-26

### Lagt til
- **Umami Analytics integrasjon**: Integrert personvernvennlig, cookiefri besøksstatistikk med Umami Cloud på tvers av alle undersider (`index.html`, `fpl.html`, `galleri.html`, `changelog.html`), med automatisk sporing av unike besøk, sidevisninger, referrers og klikk-hendelser (`data-umami-event`).
- **Gjenopprettet gatekunst & bakgrunnsgraffiti**: Gjennomført plassering av autentiske graffiti-tags (`Kraft`, `KK`, `Ranheim Gerilja`, `Ranheim`) i *Sedgwick Ave Display* i bakgrunnen (`-z-10`, `pointer-events-none`) med subtil opasitet, slik at de gir portalen rå street-art-identitet uten å overlappe eller forstyrre tekst og klikkbare knapper på mobil.
- **Sanntids RSS-henting fra Ranheim Fotball**: Implementert klientside sanntidshenting av `https://www.ranheimfotball.no/rss-nyheter` via Jina AI CORS-proxy (`x-respond-with: text`) med `DOMParser()` og automatisk fallback til lokal `assets/news.json`.
- **Oppdatert nyhetsfeed**: Både static fallback og lokal feed er oppdatert med ferskeste sak: «Sterk borteseier på Raufoss for gutta og ellevill cupfest i vente i fjæra!».

### Endret
- **Nedtonet og ryddigere hero-seksjon**: Fjernet svulstig slagord og lang velkomsttekst; erstattet med en skarp, minimalistisk overskrift (*«Prosjekter og eksperimenter»*) og en ren, konsis beskrivelse.
- **Kompakt kontaktstripe**: Erstattet den store «Kreativitet i hjertet...»-boksen og den overdrevne, skjeve tegneserie-knappen med en lavmælt og elegant glass-stripe med matchende knapper for YouTube, GitHub og Ta kontakt.
- **Finjustert mobildesign**: Gjennomgått og verifisert alle elementer på tvers av 320px–390px visninger; header, videospiller og prosjektkort har balansert margin og null overlapp.

---

## [1.5.0] - 2026-10-26

### Endret
- **Mobilvisning & Layout**: Fjernet store flytende bakgrunnsord som kolliderte og lå over tekst og videospiller på mobilskjermer.
- **MatchPic Culler & Renamer**: Fjernet Ranheim Fotball-logo og referanse fra kortet; oppdatert tag til `AI & FOTO`.
- **Fjerning av stedsreferanser**: Fjernet referanser til Ranheim, Trondheim og Norge i header (`Prosjektportal • Live`), bunnkort og footer.
- **Rent 3-prosjekts Grid**: Etablert et ryddig, balansert rutenett med kun reelle prosjekter (MatchPic Culler, FPL Optimizer, Bildegalleri).

### Fjernet
- Fjernet uferdige mockups (Ranheim Visuals, Strømtracker og Prosjekt Delta).
- Fjernet kategorifilter-knapperad i hero-seksjonen.
- Skjult anamorphic flares på mobil for å forhindre linjer tvers over tekst.

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
- **Sikker tilgangskontroll**: Dørvakt-skript for sikker passordverifisering og generering av forhåndsvisninger/ZIP uten API-nøkler i frontend.

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
