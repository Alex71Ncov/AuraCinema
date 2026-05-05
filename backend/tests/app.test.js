import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import { MovieNotFoundError } from "../src/errors.js";

async function startTestServer(app) {
  const server = app.listen(0);
  after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));

  return `http://127.0.0.1:${server.address().port}`;
}

test("GET /api/movies fara title intoarce 400", async () => {
  const app = createApp({
    movieService: {
      async getMovieByTitle() {
        throw new Error("Nu ar trebui apelat serviciul.");
      }
    }
  });
  const baseUrl = await startTestServer(app);

  const response = await fetch(`${baseUrl}/api/movies`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.message, /titlul/i);
});

test("GET /api/movies mapeaza filmul negasit la 404", async () => {
  const app = createApp({
    movieService: {
      async getMovieByTitle() {
        throw new MovieNotFoundError("Movie not found!");
      }
    }
  });
  const baseUrl = await startTestServer(app);

  const response = await fetch(`${baseUrl}/api/movies?title=film-inexistent`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.message, "Movie not found!");
});
