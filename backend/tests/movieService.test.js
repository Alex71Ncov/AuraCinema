import assert from "node:assert/strict";
import { test } from "node:test";

import { createMovieService } from "../src/services/movieService.js";
import { normalizeTitle } from "../src/utils/title.js";

function sampleMovie(overrides = {}) {
  return {
    Response: "True",
    Title: "Dune",
    Year: "2021",
    Rated: "PG-13",
    Runtime: "155 min",
    Plot: "Paul Atreides ajunge pe Arrakis.",
    Poster: "https://assets.auracinema.test/dune.jpg",
    Ratings: [{ Source: "Rotten Tomatoes", Value: "83%" }],
    imdbRating: "8.0",
    ...overrides
  };
}

function createMemoryCache() {
  const entries = new Map();

  return {
    async get(title) {
      return entries.get(normalizeTitle(title)) ?? null;
    },
    async set(title, data) {
      const entry = {
        data,
        expiresAt: "2026-05-06T12:00:00.000Z"
      };
      entries.set(normalizeTitle(title), entry);
      return entry;
    }
  };
}

test("cache-ul proaspat evita apelul catre OMDb", async () => {
  const cache = createMemoryCache();
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
  const cache = createMemoryCache();
  await cache.set("Dune", {
    title: "Dune",
    scorePercent: 72
  });

  let calls = 0;
  const movieService = createMovieService({
    cache,
    omdbClient: {
      async fetchMovie() {
        calls += 1;
        return sampleMovie({
          Plot: "Versiune actualizata.",
          Ratings: [{ Source: "Rotten Tomatoes", Value: "91%" }]
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
