import assert from "node:assert/strict";
import { test } from "node:test";

import { createMovieCache } from "../src/cache/createMovieCache.js";
import { MongoMovieCache } from "../src/cache/mongoMovieCache.js";
import { ConfigurationError } from "../src/errors.js";

function createCollectionMock(initialEntry = null) {
  const calls = {
    createIndex: [],
    findOne: [],
    updateOne: []
  };

  return {
    calls,
    collection: {
      async createIndex(keys, options) {
        calls.createIndex.push({ keys, options });
      },
      async findOne(query) {
        calls.findOne.push(query);
        return initialEntry;
      },
      async updateOne(filter, update, options) {
        calls.updateOne.push({ filter, update, options });
        return { acknowledged: true };
      }
    }
  };
}

test("MongoMovieCache creeaza index TTL pentru expirarea cache-ului", async () => {
  const { calls, collection } = createCollectionMock();
  const cache = new MongoMovieCache({ collection });

  await cache.init();

  assert.deepEqual(calls.createIndex, [
    {
      keys: { expiresAt: 1 },
      options: { expireAfterSeconds: 0, name: "expiresAt_ttl" }
    }
  ]);
});

test("MongoMovieCache citeste intrari valide dupa titlul normalizat", async () => {
  const { calls, collection } = createCollectionMock({
    _id: "dune",
    expiresAt: new Date("2026-05-06T12:00:00.000Z"),
    data: { title: "Dune", scorePercent: 83 }
  });
  const cache = new MongoMovieCache({
    collection,
    clock: () => new Date("2026-05-05T12:00:00.000Z").getTime()
  });

  const entry = await cache.get(" Dune ");

  assert.deepEqual(calls.findOne, [{ _id: "dune" }]);
  assert.deepEqual(entry, {
    expiresAt: "2026-05-06T12:00:00.000Z",
    data: { title: "Dune", scorePercent: 83 }
  });
});

test("MongoMovieCache ignora intrarile expirate", async () => {
  const { collection } = createCollectionMock({
    _id: "dune",
    expiresAt: new Date("2026-05-04T12:00:00.000Z"),
    data: { title: "Dune" }
  });
  const cache = new MongoMovieCache({
    collection,
    clock: () => new Date("2026-05-05T12:00:00.000Z").getTime()
  });

  assert.equal(await cache.get("Dune"), null);
});

test("MongoMovieCache salveaza intrari prin upsert", async () => {
  const { calls, collection } = createCollectionMock();
  const cache = new MongoMovieCache({
    collection,
    clock: () => new Date("2026-05-05T12:00:00.000Z").getTime(),
    ttlHours: 24
  });

  const result = await cache.set("Dune", { title: "Dune", scorePercent: 83 });

  assert.equal(result.expiresAt, "2026-05-06T12:00:00.000Z");
  assert.deepEqual(result.data, { title: "Dune", scorePercent: 83 });
  assert.deepEqual(calls.updateOne[0].filter, { _id: "dune" });
  assert.deepEqual(calls.updateOne[0].options, { upsert: true });
});

test("createMovieCache cere MONGODB_URI", async () => {
  await assert.rejects(() => createMovieCache({ mongoUri: "" }), ConfigurationError);
});
