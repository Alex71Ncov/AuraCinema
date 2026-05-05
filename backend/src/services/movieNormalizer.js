import { buildRecommendation, extractRatingScore } from "../recommendation.js";

function valueOrFallback(value, fallback) {
  if (!value || value === "N/A") {
    return fallback;
  }

  return value;
}

export function normalizeOmdbMovie(movie) {
  const score = extractRatingScore(movie);

  return {
    title: valueOrFallback(movie.Title, "Titlu indisponibil"),
    year: valueOrFallback(movie.Year, "An indisponibil"),
    rated: valueOrFallback(movie.Rated, "Evaluare indisponibila"),
    runtime: valueOrFallback(movie.Runtime, "Durata indisponibila"),
    plot: valueOrFallback(movie.Plot, "Descriere indisponibila."),
    poster: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null,
    scorePercent: score.percent,
    scoreSource: score.source,
    recommendation: buildRecommendation(score.percent)
  };
}
