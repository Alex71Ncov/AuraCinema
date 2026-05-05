import {
  Calendar,
  Clock,
  Film,
  RefreshCcw,
  Search,
  Shield,
  Sparkles,
  Star
} from "lucide-react";
import { useMemo, useState } from "react";

import { fetchMovie } from "./api.js";

const quickSearches = [
  "Guardians of the Galaxy",
  "Dune",
  "The Godfather"
];

function formatCacheDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getScoreClass(score) {
  if (score === null || score === undefined) {
    return "score score-unknown";
  }

  if (score > 80) {
    return "score score-high";
  }

  if (score < 50) {
    return "score score-low";
  }

  return "score score-mid";
}

export default function App() {
  const [query, setQuery] = useState("");
  const [lastTitle, setLastTitle] = useState("");
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const cacheLabel = useMemo(() => {
    if (!movie?.cacheExpiresAt) {
      return "";
    }

    const prefix = movie.cached ? "Din cache pana la" : "Date proaspete pana la";
    return `${prefix} ${formatCacheDate(movie.cacheExpiresAt)}`;
  }, [movie]);

  async function loadMovie(title, { refresh = false } = {}) {
    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      setError("Introduceti titlul unui film.");
      setMovie(null);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await fetchMovie(cleanedTitle, { refresh });
      setMovie(data);
      setLastTitle(cleanedTitle);
      setQuery(cleanedTitle);
    } catch (loadError) {
      setError(loadError.message);
      setMovie(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadMovie(query);
  }

  return (
    <main className="app-shell">
      <section className="search-surface" aria-labelledby="app-title">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            <Film size={22} />
          </span>
          <span>AuraCinema</span>
        </div>

        <div className="intro-grid">
          <div>
            <h1 id="app-title">AuraCinema</h1>
            <p className="lede">
              Cauta un film, vezi ratingul publicului si primeste o recomandare
              rapida pentru seara asta.
            </p>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="movie-title">
              Titlul filmului
            </label>
            <div className="search-field">
              <Search size={20} aria-hidden="true" />
              <input
                id="movie-title"
                type="search"
                value={query}
                placeholder="Guardians of the Galaxy"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button className="primary-button" type="submit" disabled={isLoading}>
              <Search size={18} aria-hidden="true" />
              <span>{isLoading ? "Se cauta" : "Cauta"}</span>
            </button>
          </form>
        </div>

        <div className="quick-row" aria-label="Cautari rapide">
          {quickSearches.map((title) => (
            <button
              key={title}
              className="ghost-button"
              type="button"
              onClick={() => loadMovie(title)}
            >
              {title}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <section className="state-banner error-banner" role="alert">
          <Shield size={18} aria-hidden="true" />
          <span>{error}</span>
        </section>
      ) : null}

      <section className="result-surface" aria-live="polite">
        {isLoading ? (
          <div className="empty-state">
            <span className="loader" aria-hidden="true" />
            <p>Se incarca datele filmului.</p>
          </div>
        ) : movie ? (
          <article className="movie-layout">
            <div className="poster-frame">
              {movie.poster ? (
                <img src={movie.poster} alt={`Poster ${movie.title}`} />
              ) : (
                <div className="poster-fallback">
                  <Film size={46} aria-hidden="true" />
                  <span>Poster indisponibil</span>
                </div>
              )}
            </div>

            <div className="movie-details">
              <div className="movie-heading">
                <div>
                  <p className="eyebrow">Rezultat OMDb</p>
                  <h2>{movie.title}</h2>
                </div>
                <div className={getScoreClass(movie.scorePercent)}>
                  <Star size={20} aria-hidden="true" />
                  <span>
                    {movie.scorePercent === null || movie.scorePercent === undefined
                      ? "N/A"
                      : `${movie.scorePercent}%`}
                  </span>
                  {movie.scoreSource ? <small>{movie.scoreSource}</small> : null}
                </div>
              </div>

              <div className="meta-grid">
                <span>
                  <Calendar size={18} aria-hidden="true" />
                  {movie.year}
                </span>
                <span>
                  <Shield size={18} aria-hidden="true" />
                  {movie.rated}
                </span>
                <span>
                  <Clock size={18} aria-hidden="true" />
                  {movie.runtime}
                </span>
              </div>

              <p className="plot">{movie.plot}</p>

              <div className="recommendation">
                <Sparkles size={20} aria-hidden="true" />
                <span>{movie.recommendation}</span>
              </div>

              <div className="result-actions">
                {cacheLabel ? <span className="cache-note">{cacheLabel}</span> : null}
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!lastTitle || isLoading}
                  onClick={() => loadMovie(lastTitle, { refresh: true })}
                >
                  <RefreshCcw size={18} aria-hidden="true" />
                  <span>Reimprospateaza</span>
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="empty-state">
            <Film size={42} aria-hidden="true" />
            <p>Niciun film selectat.</p>
          </div>
        )}
      </section>
    </main>
  );
}
