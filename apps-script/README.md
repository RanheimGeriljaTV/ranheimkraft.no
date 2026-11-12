# Galleri Backend

Backend-tjeneste for bildegalleriet på `ranheimkraft.no/galleri.html`.

## Funksjonalitet & Sikkerhet
- **Serverløst API**: Serverer albumoversikt og optimaliserte forhåndsvisninger for arrangementsgalleriet.
- **Kryptografisk passordbeskyttelse (Forslag A)**: Støtter saltet SHA-256 hashing med systempepper, slik at ingen råtekstpassord trenger å ligge eksponert.
- **Brute-Force-bremse (Forslag B)**: Gale passordforsøk settes i kø (`LockService`) og får økende ventetid (opptil 8 sekunder) etter 5 feil. Det er ingen full utesperring, så andre ikke kan låse ute ekte brukere. Et riktig passord slipper alltid inn.
- **Administrasjon**: Egen meny i regnearket (`🖼️ Galleri` -> `🔒 Sikre passord`) for å kryptere og hashe eventuelle nye passord med ett klikk.
- **Nedlasting**: Støtter direktevisning og samlet ZIP-nedlasting.

## Hva passordet beskytter (og ikke)
- Passordet **skjuler bare listen**: uten passord får du ikke vite hvilke bilder som finnes.
- Mappene er delt med «alle med lenken» (kreves for at bildene skal vises på nettsiden). Den som allerede har en bilde- eller mappelenke har tilgang, også etter at passordet er byttet.
- Vil du beskytte selve filene, må bildene vises gjennom Apps Script med et kortlivet token. Det er ikke bygget.

## Etter endringer i `Code.gs`
Lim den nye koden inn i Apps Script og velg **Distribuer → Administrer distribusjoner → Rediger → Ny versjon**. Da beholdes samme URL.
