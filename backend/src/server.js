import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "./app.js";
import { createMovieCache } from "./cache/createMovieCache.js";
import { createMovieService } from "./services/movieService.js";
import { createOmdbClient } from "./services/omdbClient.js";

const currentFile = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(currentFile), "..");
const repoRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env"), override: true });

const parsedPort = Number(process.env.PORT);
const parsedCacheTtlHours = Number(process.env.CACHE_TTL_HOURS);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 4000;
const cacheTtlHours =
  Number.isFinite(parsedCacheTtlHours) && parsedCacheTtlHours > 0
    ? parsedCacheTtlHours
    : 24;
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
const cacheDriver = process.env.CACHE_DRIVER ?? "json-server";
const jsonServerUrl = process.env.JSON_SERVER_URL ?? "http://127.0.0.1:5001";

const cache = createMovieCache({
  backendRoot,
  cacheDriver,
  cacheTtlHours,
  jsonServerUrl
});

const movieService = createMovieService({
  cache,
  omdbClient: createOmdbClient({
    apiKey: process.env.OMDB_API_KEY
  })
});

const app = createApp({
  movieService,
  corsOrigin
});

app.listen(port, () => {
  console.log(`AuraCinema API ruleaza pe http://localhost:${port}`);
});
