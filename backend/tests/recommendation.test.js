import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRecommendation,
  extractRatingScore
} from "../src/recommendation.js";

test("ratingul Rotten Tomatoes are prioritate fata de IMDb", () => {
  const score = extractRatingScore({
    Ratings: [
      {
        Source: "Internet Movie Database",
        Value: "8.0/10"
      },
      {
        Source: "Rotten Tomatoes",
        Value: "92%"
      }
    ],
    imdbRating: "7.1"
  });

  assert.deepEqual(score, {
    percent: 92,
    source: "Rotten Tomatoes"
  });
});

test("ratingul IMDb este fallback cand lipseste Rotten Tomatoes", () => {
  const score = extractRatingScore({
    Ratings: [],
    imdbRating: "6.4"
  });

  assert.deepEqual(score, {
    percent: 64,
    source: "IMDb"
  });
});

test("recomandarile respecta pragurile cerute", () => {
  assert.equal(
    buildRecommendation(81),
    "Ar trebui sa vizionati acest film chiar acum!"
  );
  assert.equal(buildRecommendation(49), "Ar trebui sa evitati filmul cu orice pret.");
  assert.equal(
    buildRecommendation(65),
    "Filmul merita luat in calcul, dar nu este o recomandare urgenta."
  );
  assert.equal(
    buildRecommendation(null),
    "Nu exista suficiente date de rating pentru o recomandare ferma."
  );
});
