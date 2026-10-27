# Galleri Backend

Backend-tjeneste for bildegalleriet på `ranheimkraft.no/galleri.html`.

## Funksjonalitet & Sikkerhet
- **Serverløst API**: Serverer albumoversikt og optimaliserte forhåndsvisninger for arrangementsgalleriet.
- **Kryptografisk passordbeskyttelse (Forslag A)**: Støtter saltet SHA-256 hashing med systempepper, slik at ingen råtekstpassord trenger å ligge eksponert.
- **Brute-Force Lockout (Forslag B)**: Automatisk midlertidig sperre (15 minutter) etter 5 mislykkede passordforsøk via CacheService.
- **Administrasjon**: Egen meny i regnearket (`🖼️ Galleri` -> `🔒 Sikre passord`) for å kryptere og hashe eventuelle nye passord med ett klikk.
- **Nedlasting**: Støtter direktevisning og samlet ZIP-nedlasting.
