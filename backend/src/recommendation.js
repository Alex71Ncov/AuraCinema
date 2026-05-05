const UNKNOWN_RECOMMENDATION =
  "Nu exista suficiente date de rating pentru o recomandare ferma.";

export function extractRatingScore(movie) {
  const ratings = Array.isArray(movie?.Ratings) ? movie.Ratings : [];
  const rottenTomatoes = ratings.find(
    (rating) => rating.Source?.toLowerCase() === "rotten tomatoes"
  );

  if (rottenTomatoes?.Value?.endsWith("%")) {
    const percent = Number.parseInt(rottenTomatoes.Value, 10);

    if (Number.isFinite(percent)) {
      return {
        percent,
        source: "Rotten Tomatoes"
      };
    }
  }

  const imdbRating = Number.parseFloat(movie?.imdbRating);

  if (Number.isFinite(imdbRating)) {
    return {
      percent: Math.round(imdbRating * 10),
      source: "IMDb"
    };
  }

  return {
    percent: null,
    source: null
  };
}

export function buildRecommendation(scorePercent) {
  if (scorePercent === null || scorePercent === undefined) {
    return UNKNOWN_RECOMMENDATION;
  }

  if (scorePercent > 80) {
    return "Ar trebui sa vizionati acest film chiar acum!";
  }

  if (scorePercent < 50) {
    return "Ar trebui sa evitati filmul cu orice pret.";
  }

  return "Filmul merita luat in calcul, dar nu este o recomandare urgenta.";
}
