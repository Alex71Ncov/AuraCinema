const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function normalizeApiError(message, status) {
  const rawMessage = String(message || "").trim();
  const legacyStorageMessage = /json\s*-?\s*server/i.test(rawMessage);

  if (legacyStorageMessage) {
    return "Backend-ul foloseste acum MongoDB. Redeploy-uieste backend-ul pe Render si verifica variabilele MONGODB_URI si Network Access in Atlas.";
  }

  if (rawMessage) {
    return rawMessage;
  }

  if (status === 404) {
    return "Filmul nu a fost gasit.";
  }

  if (status === 503) {
    return "Backend-ul nu este disponibil momentan. Verifica serviciul Render si conexiunea MongoDB Atlas.";
  }

  if (status >= 500) {
    return "Backend-ul a intampinat o eroare. Verifica logurile din Render.";
  }

  return "Nu s-au putut incarca datele filmului.";
}

export async function fetchMovie(title, { refresh = false } = {}) {
  const url = new URL("/api/movies", API_BASE_URL);
  url.searchParams.set("title", title);

  if (refresh) {
    url.searchParams.set("refresh", "true");
  }

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "Nu se poate contacta backend-ul. Verifica URL-ul Render din VITE_API_BASE_URL si daca serviciul este pornit."
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(normalizeApiError(body.message, response.status));
  }

  return body;
}
