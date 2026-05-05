import { ConfigurationError, ExternalApiError } from "../errors.js";

export function createOmdbClient({
  apiKey = process.env.OMDB_API_KEY,
  fetchImpl = fetch,
  timeoutMs = 8000
} = {}) {
  return {
    async fetchMovie(title) {
      if (!apiKey || apiKey === "your_omdb_api_key_here") {
        throw new ConfigurationError(
          "Setati OMDB_API_KEY in .env inainte de a cauta filme."
        );
      }

      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("t", title);
      url.searchParams.set("plot", "short");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(url, { signal: controller.signal });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401 || body?.Error === "Invalid API key!") {
            throw new ConfigurationError(
              "Cheia OMDb din .env este invalida sau nu a fost activata."
            );
          }

          throw new ExternalApiError(
            body?.Error || `OMDb a raspuns cu status HTTP ${response.status}.`
          );
        }

        return body;
      } catch (error) {
        if (error instanceof ConfigurationError || error instanceof ExternalApiError) {
          throw error;
        }

        if (error.name === "AbortError") {
          throw new ExternalApiError("Cererea catre OMDb a expirat.");
        }

        throw new ExternalApiError("Nu s-a putut contacta OMDb.");
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
