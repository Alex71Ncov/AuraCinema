import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { FileMovieCache } from "../src/cache/fileMovieCache.js";
import { createMovieService } from "../src/services/movieService.js";

function sampleMovie(overrides = {}) {
  return {
    Response: "True",
    Title: "Dune",
    Year: "2021",
    Rated: "PG-13",
    Runtime: "155 min",
    Plot: "Paul Atreides ajunge pe Arrakis.",
    Poster: "https://example.com/dune.jpg",
    Ratings: [
      {
        Source: "Rotten Tomatoes",
        Value: "83%"
      }
    ],
    imdbRating: "8.0",
    ...overrides
  };
}

async function createTempCache() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "auracinema-cache-"));

  return new FileMovieCache({
    filePath: path.join(dir, "movies-cache.json"),
    ttlHours: 24
  });
}

test("cache-ul proaspat evita apelul catre OMDb", async () => {
  const cache = await createTempCache();
  let calls = 0;

  const movieService = createMovieService({
    cache,
    omdbClient: {
      async fetchMovie() {
        calls += 1;
        return sampleMovie();
      }
    }
  });

  const firstResult = await movieService.getMovieByTitle("Dune");
  const secondResult = await movieService.getMovieByTitle("  dune  ");

  assert.equal(calls, 1);
  assert.equal(firstResult.cached, false);
  assert.equal(secondResult.cached, true);
  assert.equal(secondResult.title, "Dune");
});

test("refresh=true ocoleste cache-ul si actualizeaza raspunsul", async () => {
  const cache = await createTempCache();
  await cache.set("Dune", {
    title: "Dune",
    year: "2021",
    rated: "PG-13",
    runtime: "155 min",
    plot: "Versiune veche.",
    poster: null,
    scorePercent: 72,
    scoreSource: "IMDb",
    recommendation: "Filmul merita luat in calcul, dar nu este o recomandare urgenta."
  });

  let calls = 0;
  const movieService = createMovieService({
    cache,
    omdbClient: {
      async fetchMovie() {
        calls += 1;
        return sampleMovie({
          Plot: "Versiune actualizata.",
          Ratings: [
            {
              Source: "Rotten Tomatoes",
              Value: "91%"
            }
          ]
        });
      }
    }
  });

  const result = await movieService.getMovieByTitle("Dune", { refresh: true });

  assert.equal(calls, 1);
  assert.equal(result.cached, false);
  assert.equal(result.plot, "Versiune actualizata.");
  assert.equal(result.scorePercent, 91);
});
