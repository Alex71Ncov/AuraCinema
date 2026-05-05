import assert from "node:assert/strict";
import { test } from "node:test";

import { ConfigurationError, ExternalApiError } from "../src/errors.js";
import { createOmdbClient } from "../src/services/omdbClient.js";

function jsonResponse({ status = 200, body }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  };
}

test("OMDb 401 este raportat ca problema de configurare", async () => {
  const client = createOmdbClient({
    apiKey: "invalid",
    fetchImpl: async () =>
      jsonResponse({
        status: 401,
        body: {
          Response: "False",
          Error: "Invalid API key!"
        }
      })
  });

  await assert.rejects(() => client.fetchMovie("Dune"), ConfigurationError);
});

test("erorile HTTP OMDb pastreaza mesajul extern cand exista", async () => {
  const client = createOmdbClient({
    apiKey: "valid-looking",
    fetchImpl: async () =>
      jsonResponse({
        status: 429,
        body: {
          Response: "False",
          Error: "Request limit reached!"
        }
      })
  });

  await assert.rejects(
    () => client.fetchMovie("Dune"),
    (error) =>
      error instanceof ExternalApiError &&
      error.message === "Request limit reached!"
  );
});
