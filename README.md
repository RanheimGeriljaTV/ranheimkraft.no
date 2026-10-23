# Ranheim Kraft (ranheimkraft.no)

Personlig portal og launchpad for prosjekter, kode-eksperimenter, webapplikasjoner og kreative konsepter under domenet `ranheimkraft.no`.

* **Offisiell URL:** [https://ranheimkraft.no/](https://ranheimkraft.no/)
* **GitHub Pages URL:** [https://ranheimgeriljatv.github.io/ranheimkraft.no/](https://ranheimgeriljatv.github.io/ranheimkraft.no/)
* **Offisielt GitHub Repo:** [RanheimGeriljaTV/ranheimkraft.no](https://github.com/RanheimGeriljaTV/ranheimkraft.no)

## Fremhevede Prosjekter
* **[MatchPic Culler & Renamer](https://github.com/RanheimGeriljaTV/MatchPic-Culler-Renamer)**: AI-drevet skrivebordsverktøy for sportsfotografering, utvelgelse og omdøping av kampbilder for Ranheim Fotball.

## Estetikk & Stilretning
* **Live News Ticker:** Direkte, heldekkende (edge-to-edge) nyhetsticker øverst med offisiell Ranheim IL-logo og ferske nyheter fra [ranheimfotball.no](https://www.ranheimfotball.no). Pauser automatisk ved hover og lenker direkte til kampsaker.
* **Glassmorphism:** Frostet glass (`backdrop-blur`), lysbrytende rammer og semitransparente overflater.
* **Anamorphic Flares:** Horisontale, filmiske linseglimt i cyan og neon-pink.
* **Minimalisme:** Bento-grid med ryddig typografi (*Space Grotesk*) og god struktur.
* **Tegneserie & Pop-art:** Halftone dot-bakgrunner og klistremerke-badger (*Bangers*).
* **Graffiti & Street-art:** Håndtegnede street-tags (*Sedgwick Ave*) og spray glow-effekter.
* **Mobil-først:** Kompakt header, sveipbar filterrad, store trykkflater (min. 44px), safe-area-støtte for iPhone og lettere rendering (ingen backdrop-blur) på telefon.
* **Ranheim Gerilja TV Spotlight:** Integrert, rammeløs og kompakt YouTube-avspiller med loopet demovisning (muted auto-play) for `@RanheimGeriljaTV`.

## Filstruktur
```text
ranheimkraft.no/
├── index.html                   # Hovedside / Prosjektportal
├── Ranheim_gerilja_tv_B.png     # Original logo / artwork (4000x4000)
├── Ranheim_gerilja_tv_B.webp    # Web-optimalisert artwork
├── 2560px-Ranheim_IL_logo.png   # Offisiell Ranheim IL-logo (2560x862)
├── Ranheim_IL_logo_800.webp     # Web-optimalisert logo for rask innlasting
└── README.md                    # Dokumentasjon
```

## Lokalt oppsett
Åpne `index.html` direkte i en nettleser, eller kjør en lokal webserver:
```bash
# Python
python -m http.server 8000
```
Besøk deretter [http://localhost:8000](http://localhost:8000).
