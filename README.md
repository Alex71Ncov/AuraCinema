# AuraCinema

AuraCinema este o aplicatie full-stack React + Node/Express care cauta informatii despre filme prin OMDb, afiseaza posterul si ratingul, apoi recomanda vizionarea in functie de scorul publicului. Backend-ul memoreaza raspunsurile intr-un cache MongoDB Atlas pentru a evita apeluri repetate catre API-ul extern.

## Structura

- `frontend/` - aplicatie Vite + React, JavaScript si CSS standard.
- `backend/` - API Express, integrare OMDb si cache MongoDB.
- `docs/` - documentatie in romana, diagrame Mermaid si PDF generat.
- `scripts/` - utilitare locale, inclusiv generatorul de PDF.

## Pornire locala

1. Instaleaza dependintele:

   ```bash
   npm install
   ```

2. Creeaza configuratia locala.

   In `backend/.env` pastreaza configuratia backend:

   ```env
   PORT=4000
   CORS_ORIGIN=http://localhost:5173
   CACHE_TTL_HOURS=24
   MONGODB_URI=mongodb+srv://user:parola@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=auracinema
   MONGODB_CACHE_COLLECTION=movieCache
   OMDB_API_KEY=cheia_ta_omdb
   ```

   In `frontend/.env` pastreaza doar URL-ul API-ului:

   ```env
   VITE_API_BASE_URL=http://localhost:4000
   ```

3. Completeaza `OMDB_API_KEY` si `MONGODB_URI` in `backend/.env`. Cheia gratuita OMDb se poate obtine de la [omdbapi.com](https://www.omdbapi.com/), iar connection string-ul MongoDB se copiaza din Atlas > Connect > Drivers.

4. Porneste aplicatia in doua terminale separate:

   Terminal 1:

   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2:

   ```bash
   cd frontend
   npm run dev
   ```

Backend-ul ruleaza pe `http://localhost:4000`, iar frontend-ul pe `http://localhost:5173`.

## Scripturi

- `npm run dev` - porneste backend-ul si frontend-ul in paralel din root, optional.
- `npm run dev:frontend` - porneste doar aplicatia React.
- `npm run dev:backend` - porneste doar API-ul Express.
- `npm run build` - compileaza frontend-ul.
- `npm test` - ruleaza testele backend.
- `npm run docs:pdf` - regenereaza `docs/AuraCinema-documentatie.pdf`.

## API

- `GET /api/health` - verifica starea serverului.
- `GET /api/movies?title=Guardians+of+the+Galaxy` - cauta filmul si foloseste cache-ul MongoDB.
- `GET /api/movies?title=Guardians+of+the+Galaxy&refresh=true` - forteaza reimprospatarea datelor din OMDb.

## Documentatie

Documentatia proiectului este in `docs/documentatie.md`, iar varianta PDF generata este `docs/AuraCinema-documentatie.pdf`.

## Observatii

- Daca backend-ul nu porneste, verifica `MONGODB_URI` si `OMDB_API_KEY`.
- In MongoDB Atlas, permite conexiuni din Render sau foloseste temporar `0.0.0.0/0` cu user si parola puternice.
- Pentru Render: Root Directory `backend`, Build Command `npm install`, Start Command `npm start`, Health Check Path `/api/health`.
- Pentru Vercel: Root Directory `frontend`, Framework `Vite`, Build Command `npm run build`, Output Directory `dist`.
