import { normalizeTitle } from "../utils/title.js";

export class MongoMovieCache {
  constructor({ collection, ttlHours = 24, clock = () => Date.now() }) {
    const parsedTtlHours = Number(ttlHours);

    this.collection = collection;
    this.ttlMs =
      Number.isFinite(parsedTtlHours) && parsedTtlHours > 0
        ? parsedTtlHours * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    this.clock = clock;
  }

  async init() {
    await this.collection.createIndex(
      {
        expiresAt: 1
      },
      {
        expireAfterSeconds: 0,
        name: "expiresAt_ttl"
      }
    );
  }

  async get(title) {
    const entry = await this.collection.findOne({
      _id: normalizeTitle(title)
    });

    if (!entry) {
      return null;
    }

    const expiresAt = new Date(entry.expiresAt);

    if (expiresAt.getTime() <= this.clock()) {
      return null;
    }

    return {
      data: entry.data,
      expiresAt: expiresAt.toISOString()
    };
  }

  async set(title, data) {
    const now = this.clock();
    const expiresAt = new Date(now + this.ttlMs);

    await this.collection.updateOne(
      {
        _id: normalizeTitle(title)
      },
      {
        $set: {
          originalTitle: title,
          fetchedAt: new Date(now),
          expiresAt,
          data
        }
      },
      {
        upsert: true
      }
    );

    return {
      data,
      expiresAt: expiresAt.toISOString()
    };
  }
}
