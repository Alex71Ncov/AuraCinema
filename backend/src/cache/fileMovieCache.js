import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeTitle } from "../utils/title.js";

export class FileMovieCache {
  constructor({ filePath, ttlHours = 24, clock = () => Date.now() }) {
    const parsedTtlHours = Number(ttlHours);

    this.filePath = filePath;
    this.ttlMs =
      Number.isFinite(parsedTtlHours) && parsedTtlHours > 0
        ? parsedTtlHours * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    this.clock = clock;
  }

  async get(title) {
    const key = normalizeTitle(title);
    const store = await this.#readStore();
    const entry = store[key];

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
    const store = await this.#readStore();
    const now = this.clock();
    const fetchedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + this.ttlMs).toISOString();

    store[key] = {
      originalTitle: title,
      fetchedAt,
      expiresAt,
      data
    };

    await this.#writeStore(store);

    return {
      data,
      expiresAt
    };
  }

  async #readStore() {
    try {
      const file = await readFile(this.filePath, "utf8");
      return JSON.parse(file);
    } catch (error) {
      if (error.code === "ENOENT" || error instanceof SyntaxError) {
        return {};
      }

      throw error;
    }
  }

  async #writeStore(store) {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    const temporaryFile = `${this.filePath}.tmp`;
    await writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`);
    await rename(temporaryFile, this.filePath);
  }
}
