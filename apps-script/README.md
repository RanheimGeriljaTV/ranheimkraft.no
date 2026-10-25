# Ranheim Kraft â€“ Passordbeskyttet Bildegalleri Backend

Denne mappen inneholder backend-koden for det passordbeskyttede bildegalleriet pÃ¥ **`ranheimkraft.no/galleri.html`**.

## Hvordan det fungerer
* **Dine bilder ligger pÃ¥ Google Disk:** Du oppretter en mappe pÃ¥ Google Disk for hvert galleri (f.eks. en kamp eller et arrangement).
* **Kontrollpanel i Google Regneark:** Et privat regneark hos Google der hver rad representerer et galleri med tittel, dato, lenke til Google Disk-mappen, og valgfritt passord.
* **Passordsikkerhet:** Passordene sjekkes sikkert hos Google via Apps Script (`Code.gs`). Passordene ligger aldri i Ã¥pen kildekode pÃ¥ GitHub!
* **Ett-klikks ZIP-nedlasting:** BesÃ¸kende som lÃ¥ser opp galleriet fÃ¥r se alle bildene i et lynraskt bildegalleri med fullskjerm-visning, og en stor knapp: **Â«LAST NED ALLE (DISK ZIP)Â»**.

---

## 3 Enkle steg for oppsett (Tar ca. 3 minutter)

### Steg 1: Opprett et Google Regneark
1. GÃ¥ til [sheets.new](https://sheets.new) for Ã¥ opprette et tomt Google Regneark (f.eks. gi det navnet *Â«Ranheim Kraft GallerierÂ»*).
2. I menyen Ã¸verst, velg: **Utvidelser â†’ Apps Script**.

### Steg 2: Lim inn koden
1. Slett eventuell eksisterende kode i editoren, og lim inn hele innholdet fra filen **[`Code.gs`](./Code.gs)**.
2. Trykk pÃ¥ **Lagre** (diskett-ikonet eller `Ctrl+S`).
3. GÃ¥ tilbake til regnearket og trykk oppdater (F5). Etter et par sekunder dukker det opp en ny meny Ã¸verst: **ðŸ–¼ï¸ Galleri**.
4. Trykk pÃ¥ **ðŸ–¼ï¸ Galleri â†’ 1. Opprett oppsett**. (FÃ¸rste gang mÃ¥ du godkjenne tillatelser for at scriptet skal fÃ¥ lese mappen og regnearket).
5. Tabellen opprettes automatisk med kolonnene:
   `ID | Tittel | Dato | Beskrivelse | Mappe-lenke | Passord | Aktiv`

### Steg 3: Publiser nettappen og koble til nettsiden
1. I Apps Script-editoren trykker du pÃ¥ den blÃ¥ knappen Ã¸verst til hÃ¸yre: **Distribuer â†’ Ny distribusjon**.
2. Velg type: **Nettapp** (tannhjul-ikonet).
3. Still inn fÃ¸lgende:
   * **Beskrivelse:** `Ranheim Kraft Galleri API`
   * **KjÃ¸r som:** `Meg (din e-postadresse)`
   * **Hvem har tilgang:** `Alle` (dette er nÃ¸dvendig for at nettsiden din kan hente bildene).
4. Trykk **Distribuer** og kopier **Nettapp-URL-en** (ser slik ut: `https://script.google.com/macros/s/.../exec`).
5. Ã…pne **`galleri.html`** og lim inn URL-en pÃ¥ linje 265:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/DIN_ID/exec';
   ```

Ferdig! Galleriet er nÃ¥ koblet live til Google Disken din!

