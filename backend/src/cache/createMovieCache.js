import { MongoClient } from "mongodb";

import { ConfigurationError, StorageError } from "../errors.js";
import { MongoMovieCache } from "./mongoMovieCache.js";

function redactMongoUri(value, mongoUri) {
  const message = String(value || "");
  if (!mongoUri) return message;

  let redacted = message.replaceAll(mongoUri, "[MONGODB_URI]");

  try {
    const parsedUri = new URL(mongoUri);
    const credentials = `${parsedUri.username}:${parsedUri.password}@`;
    redacted = redacted.replaceAll(credentials, "***:***@");
  } catch {
    // If the URI itself is malformed, the original full string was already removed above.
  }

  return redacted;
}

export async function createMovieCache({
  cacheTtlHours = 24,
  collectionName = "movieCache",
  databaseName = "auracinema",
  mongoUri,
  serverSelectionTimeoutMs = 10000
}) {
  if (!mongoUri) {
    throw new ConfigurationError("Setati MONGODB_URI in .env pentru cache-ul MongoDB.");
  }

  try {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: serverSelectionTimeoutMs
    });
    await client.connect();

    const collection = client.db(databaseName).collection(collectionName);
    const cache = new MongoMovieCache({
      collection,
      ttlHours: cacheTtlHours
    });
    await cache.init();

    return {
      cache,
      close: () => client.close()
    };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }

    const details = redactMongoUri(error.message, mongoUri);
    throw new StorageError(
      `Nu s-a putut initializa conexiunea MongoDB. Detalii: ${details}. Verificati MONGODB_URI, user/parola si Atlas Network Access.`,
      { cause: error }
    );
  }
}
