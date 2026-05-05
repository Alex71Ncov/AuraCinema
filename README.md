# AuraCinema

AuraCinema este o aplicatie full-stack React + Node/Express care cauta informatii despre filme prin OMDb, afiseaza posterul si ratingul, apoi recomanda vizionarea in functie de scorul publicului. Backend-ul memoreaza raspunsurile intr-un cache JSON expus prin JSON Server pentru a evita apeluri repetate catre API-ul extern.

## Structura

- `frontend/` - aplicatie Vite + React, JavaScript si CSS standard.
- `backend/` - API Express, integrare OMDb si cache JSON.
- `storage/` - JSON Server pentru cache-ul filmelor.
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

4. Porneste aplicatia in trei terminale separate:

   Terminal 1:

   ```bash
   cd storage
   npm run dev
   ```

   Terminal 2:

   ```bash
   cd backend
   npm run dev
   ```

   Terminal 3:

   ```bash
   cd frontend
   npm run dev
   ```

Storage-ul ruleaza pe `http://127.0.0.1:5001`, backend-ul pe `http://localhost:4000`, iar frontend-ul pe `http://localhost:5173`.

## Scripturi

- `npm run dev` - porneste storage-ul, backend-ul si frontend-ul in paralel din root, optional.
- `npm run dev:storage` - porneste doar JSON Server.
- `npm run dev:frontend` - porneste doar aplicatia React.
- `npm run dev:backend` - porneste doar API-ul Express.
- `npm run build` - compileaza frontend-ul.
- `npm test` - ruleaza testele backend.
- `npm run docs:pdf` - regenereaza `docs/AuraCinema-documentatie.pdf`.

## API

- `GET /api/health` - verifica starea serverului.
- `GET /api/movies?title=Guardians+of+the+Galaxy` - cauta filmul si foloseste cache-ul JSON.
- `GET /api/movies?title=Guardians+of+the+Galaxy&refresh=true` - forteaza reimprospatarea datelor din OMDb.

## Documentatie

Documentatia proiectului este in `docs/documentatie.md`, iar varianta PDF generata este `docs/AuraCinema-documentatie.pdf`.

## Observatii

- Daca backend-ul raspunde ca JSON Server nu este disponibil, porneste intai `cd storage && npm run dev`.
- Daca OMDb nu este configurat, backend-ul porneste, dar cautarea filmelor va cere completarea variabilei `OMDB_API_KEY`.
- Pentru fallback fara JSON Server, seteaza `CACHE_DRIVER=file`; backend-ul va folosi `backend/data/movies-cache.json`.
