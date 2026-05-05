import { MovieNotFoundError } from "../errors.js";
import { normalizeOmdbMovie } from "./movieNormalizer.js";

export function createMovieService({ cache, omdbClient }) {
  return {
    async getMovieByTitle(title, { refresh = false } = {}) {
      if (!refresh) {
        const cachedEntry = await cache.get(title);

        if (cachedEntry) {
          return {
            ...cachedEntry.data,
            cached: true,
            cacheExpiresAt: cachedEntry.expiresAt
          };
        }
      }

      const omdbMovie = await omdbClient.fetchMovie(title);

      if (omdbMovie.Response === "False") {
        throw new MovieNotFoundError(omdbMovie.Error || "Filmul nu a fost gasit.");
      }

      const normalizedMovie = normalizeOmdbMovie(omdbMovie);
      const cachedEntry = await cache.set(title, normalizedMovie);

      return {
        ...cachedEntry.data,
        cached: false,
        cacheExpiresAt: cachedEntry.expiresAt
      };
    }
  };
}
