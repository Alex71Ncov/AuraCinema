const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function fetchMovie(title, { refresh = false } = {}) {
  const url = new URL("/api/movies", API_BASE_URL);
  url.searchParams.set("title", title);

  if (refresh) {
    url.searchParams.set("refresh", "true");
  }

  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "Nu s-au putut incarca datele filmului.");
  }

  return body;
}
