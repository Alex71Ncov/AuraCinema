# AuraCinema

AuraCinema este o aplicatie full-stack React + Node/Express care cauta informatii despre filme prin OMDb, afiseaza posterul si ratingul, apoi recomanda vizionarea in functie de scorul publicului. Backend-ul memoreaza raspunsurile intr-un cache local JSON pentru a evita apeluri repetate catre API-ul extern.

## Structura

- `frontend/` - aplicatie Vite + React, JavaScript si CSS standard.
- `backend/` - API Express, integrare OMDb si cache JSON.
- `docs/` - documentatie in romana, diagrame Mermaid si PDF generat.
- `scripts/` - utilitare locale, inclusiv generatorul de PDF.

## Pornire locala

1. Instaleaza dependintele:

   ```bash
   npm install
   ```

2. Creeaza configuratia locala:

   ```bash
   cp .env.example .env
   ```

3. Completeaza `OMDB_API_KEY` in `.env`. Cheia gratuita se poate obtine de la [omdbapi.com](https://www.omdbapi.com/).

4. Porneste aplicatia:

   ```bash
   npm run dev
   ```

Frontend-ul ruleaza pe `http://localhost:5173`, iar backend-ul pe `http://localhost:4000`.

## Scripturi

- `npm run dev` - porneste frontend-ul si backend-ul in paralel.
- `npm run dev:frontend` - porneste doar aplicatia React.
- `npm run dev:backend` - porneste doar API-ul Express.
- `npm run build` - compileaza frontend-ul.
- `npm test` - ruleaza testele backend.
- `npm run docs:pdf` - regenereaza `docs/AuraCinema-documentatie.pdf`.

## API

- `GET /api/health` - verifica starea serverului.
- `GET /api/movies?title=Guardians+of+the+Galaxy` - cauta filmul si foloseste cache-ul local.
- `GET /api/movies?title=Guardians+of+the+Galaxy&refresh=true` - forteaza reimprospatarea datelor din OMDb.

## Documentatie

Documentatia proiectului este in `docs/documentatie.md`, iar varianta PDF generata este `docs/AuraCinema-documentatie.pdf`.
