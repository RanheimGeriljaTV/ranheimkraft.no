# Ranheim Kraft (ranheimkraft.no)

Personlig portal og launchpad for prosjekter, kode-eksperimenter, webapplikasjoner og kreative konsepter under domenet `ranheimkraft.no`.

* **Offisiell URL:** [https://ranheimkraft.no/](https://ranheimkraft.no/)
* **GitHub Pages URL:** [https://ranheimgeriljatv.github.io/ranheimkraft.no/](https://ranheimgeriljatv.github.io/ranheimkraft.no/)
* **Offisielt GitHub Repo:** [RanheimGeriljaTV/ranheimkraft.no](https://github.com/RanheimGeriljaTV/ranheimkraft.no)

## Fremhevede Prosjekter
* **[MatchPic Culler & Renamer](https://github.com/RanheimGeriljaTV/MatchPic-Culler-Renamer)**: AI-drevet skrivebordsverktøy for sportsfotografering, utvelgelse og omdøping av kampbilder.
* **[FPL Optimizer & Hub](fpl.html)**: Matematisk troppsoptimering for Fantasy Premier League med PuLP MILP solver, FDR-oversikt og FUT-spillerkort.
* **[Passordbeskyttet Bildegalleri](galleri.html)**: Dedikert galleri-underside koblet direkte til Google Disk. Støtter flere mapper med egne passord, fullskjerm-lightbox med sveip og ett-klikks ZIP-nedlasting av hele album.
* **[Endringslogg](changelog.html)**: Dedikert changelog-side som dokumenterer alle versjoner, oppdateringer og forbedringer over tid.

## Estetikk & Stilretning
* **Live News Ticker i Ranheim-gradient:** Heldekkende nyhetsticker øverst i dyp Ranheim-blå gradient med hurtig responsiv scrolling (22s desktop, 16s mobil), ren typografi og ferske nyheter fra [ranheimfotball.no](https://www.ranheimfotball.no). Oppdateres automatisk via GitHub Actions og klient-side `assets/news.json`. Pauser ved touch/hover.
* **Minimalistisk Glassmorphism:** Frostet glass (`backdrop-blur`), lysbrytende rammer, semitransparente overflater og ren typografi.
* **Glassmorphism:** Frostet glass (`backdrop-blur`), lysbrytende rammer og semitransparente overflater.
* **Anamorphic Flares:** Horisontale, filmiske linseglimt i cyan og neon-pink.
* **Minimalisme:** Bento-grid med ryddig typografi (*Space Grotesk*) og god struktur.
* **Mobil-først:** Kompakt header, sveipbar filterrad, store trykkflater (min. 44px), safe-area-støtte for iPhone og lettere rendering på telefon.
* **Ranheim Gerilja TV Spotlight:** Integrert YouTube-avspiller med terning-knapp for tilfeldig video fra arkivet til `@RanheimGeriljaTV`.

## Filstruktur
```text
ranheimkraft.no/
├── .gitignore                   # Ignorerte filer (hemmeligheter, logger, OS-filer)
├── assets/                      # Sentral ressursmappe for media og ikoner
│   ├── 2560px-Ranheim_IL_logo.png
│   ├── Ranheim_IL_logo_800.webp
│   ├── Ranheim_IL_logo.webp
│   ├── Ranheim_gerilja_tv_B.png
│   ├── Ranheim_gerilja_tv_B.webp
│   ├── logo.png
│   ├── logosove.png
│   ├── polarICON.ico            # Favicon
│   └── news.json                # Ferskeste nyheter fra Ranheim Fotball
├── apps-script/                 # Google Apps Script backend og oppsettsguide
│   ├── Code.gs                  # Apps Script dørvakt & Disk-integrasjon
│   └── README.md                # 3-minutters oppsettsveiledning
├── changelog.html               # Offisiell endringslogg (Nettside)
├── galleri.html                 # Passordbeskyttet bildegalleri (Google Disk)
├── index.html                   # Hovedside / Prosjektportal
├── CHANGELOG.md                 # Markdown endringslogg (Keep a Changelog)
└── README.md                    # Dokumentasjon
```

## Lokalt oppsett
Åpne `index.html` direkte i en nettleser, eller kjør en lokal webserver:
```bash
# Python
python -m http.server 8000
```
Besøk deretter [http://localhost:8000](http://localhost:8000).
