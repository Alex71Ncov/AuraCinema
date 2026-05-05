import assert from "node:assert/strict";
import { test } from "node:test";

import { JsonServerMovieCache } from "../src/cache/jsonServerMovieCache.js";

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return body;
    }
  };
}

test("JsonServerMovieCache citeste intrari valide din JSON Server", async () => {
  const cache = new JsonServerMovieCache({
    baseUrl: "http://storage.test",
    clock: () => new Date("2026-05-05T12:00:00.000Z").getTime(),
    fetchImpl: async (url) => {
      assert.equal(url, "http://storage.test/movieCache?key=dune");

      return jsonResponse([
        {
          id: 1,
          key: "dune",
          expiresAt: "2026-05-06T12:00:00.000Z",
          data: {
            title: "Dune",
            scorePercent: 83
          }
        }
      ]);
    }
  });

  const entry = await cache.get(" Dune ");

  assert.deepEqual(entry, {
    expiresAt: "2026-05-06T12:00:00.000Z",
    data: {
      title: "Dune",
      scorePercent: 83
    }
  });
});

test("JsonServerMovieCache salveaza intrari noi prin POST", async () => {
  const calls = [];
  const cache = new JsonServerMovieCache({
    baseUrl: "http://storage.test",
    clock: () => new Date("2026-05-05T12:00:00.000Z").getTime(),
    ttlHours: 24,
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });

      if (url.endsWith("/movieCache?key=dune")) {
        return jsonResponse([]);
      }

      assert.equal(url, "http://storage.test/movieCache");
      assert.equal(options.method, "POST");

      return jsonResponse(JSON.parse(options.body));
    }
  });

  const savedEntry = await cache.set("Dune", {
    title: "Dune",
    scorePercent: 83
  });

  assert.equal(calls.length, 2);
  assert.equal(savedEntry.expiresAt, "2026-05-06T12:00:00.000Z");
  assert.deepEqual(savedEntry.data, {
    title: "Dune",
    scorePercent: 83
  });
});
