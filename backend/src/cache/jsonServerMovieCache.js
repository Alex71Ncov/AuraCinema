import { StorageError } from "../errors.js";
import { normalizeTitle } from "../utils/title.js";

export class JsonServerMovieCache {
  constructor({
    baseUrl = "http://127.0.0.1:5001",
    ttlHours = 24,
    fetchImpl = fetch,
    clock = () => Date.now()
  } = {}) {
    const parsedTtlHours = Number(ttlHours);

    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.ttlMs =
      Number.isFinite(parsedTtlHours) && parsedTtlHours > 0
        ? parsedTtlHours * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    this.fetchImpl = fetchImpl;
    this.clock = clock;
  }

  async get(title) {
    const entry = await this.#findEntry(title);

    if (!entry) {
      return null;
    }

    if (new Date(entry.expiresAt).getTime() <= this.clock()) {
      return null;
    }

    return {
      data: entry.data,
      expiresAt: entry.expiresAt
    };
  }

  async set(title, data) {
    const key = normalizeTitle(title);
    const now = this.clock();
    const payload = {
      key,
      originalTitle: title,
      fetchedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString(),
      data
    };

    const existingEntry = await this.#findEntry(title);
    const savedEntry = existingEntry
      ? await this.#request(`/movieCache/${existingEntry.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      : await this.#request("/movieCache", {
          method: "POST",
          body: JSON.stringify(payload)
        });

    return {
      data: savedEntry.data,
      expiresAt: savedEntry.expiresAt
    };
  }

  async #findEntry(title) {
    const key = normalizeTitle(title);
    const entries = await this.#request(`/movieCache?key=${encodeURIComponent(key)}`);
    return Array.isArray(entries) ? entries[0] : null;
  }

  async #request(resource, options = {}) {
    const url = `${this.baseUrl}${resource}`;

    try {
      const response = await this.fetchImpl(url, {
        headers: {
          "Content-Type": "application/json"
        },
        ...options
      });

      if (!response.ok) {
        throw new StorageError(
          `JSON Server a raspuns cu status HTTP ${response.status}.`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        `Nu s-a putut contacta JSON Server la ${this.baseUrl}. Porniti: cd storage && npm run dev.`
      );
    }
  }
}
