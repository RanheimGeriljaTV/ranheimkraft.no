# Mal for nye Ranheim Kraft-prosjekter

Startfiler for et nytt verktøy som skal ligge på ranheimkraft.no.

| Fil | Hva den gjør |
| --- | --- |
| `CLAUDE.md` | Arbeidsreglene. Claude leser den automatisk i hver økt i prosjektmappen. |
| `.gitignore` | Holder hemmeligheter, `node_modules`, bygg og systemfiler unna GitHub. |
| `.gitattributes` | LF-linjeskift og binære bilder, så det ikke blir rot mellom Windows og GitHub. |
| `CHANGELOG.md` | Tom endringslogg i Keep a Changelog-format. |

> Denne README-en er bare for malen. Ikke kopier den inn i det nye prosjektet.

## Slik bruker du den

1. Lag mappen, f.eks. `Pyhton prosjekter\Kraft Noe`.
2. Kopier malfilene inn (kjør fra `ranheimkraft.no`-mappen):

   ```powershell
   $ny = "..\Kraft Noe"
   Copy-Item maler\nytt-prosjekt\CLAUDE.md, maler\nytt-prosjekt\.gitignore, maler\nytt-prosjekt\.gitattributes, maler\nytt-prosjekt\CHANGELOG.md $ny
   ```

3. Åpne en ny Claude-økt i den nye mappen og skriv for eksempel:

   > Les CLAUDE.md og sett opp prosjektet. Det heter Kraft Noe, repoet skal hete Kraft-Noe, det skal ligge på ranheimkraft.no/noe/, og det er statisk HTML.

   Claude fyller inn feltene, lager README, git og GitHub-repoet.

4. Når verktøyet er klart for nettsiden: gå til ranheimkraft.no-økten og si «legg ut Kraft-Noe på /noe/».
