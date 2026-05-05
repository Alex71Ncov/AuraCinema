import cors from "cors";
import express from "express";

import {
  ConfigurationError,
  ExternalApiError,
  MovieNotFoundError,
  StorageError
} from "./errors.js";

export function createApp({ movieService, corsOrigin = "http://localhost:5173" }) {
  const app = express();

  app.use(
    cors({
      origin: corsOrigin === "*" ? true : corsOrigin
    })
  );
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "AuraCinema API",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/movies", async (request, response, next) => {
    const title = String(request.query.title ?? "").trim();
    const refresh = String(request.query.refresh ?? "").toLowerCase() === "true";

    if (!title) {
      response.status(400).json({
        message: "Introduceti titlul unui film."
      });
      return;
    }

    try {
      const movie = await movieService.getMovieByTitle(title, { refresh });
      response.json(movie);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof MovieNotFoundError) {
      response.status(404).json({
        message: error.message
      });
      return;
    }

    if (error instanceof ConfigurationError) {
      response.status(503).json({
        message: error.message
      });
      return;
    }

    if (error instanceof ExternalApiError) {
      response.status(502).json({
        message: error.message
      });
      return;
    }

    if (error instanceof StorageError) {
      response.status(503).json({
        message: error.message
      });
      return;
    }

    response.status(500).json({
      message: "A aparut o eroare neasteptata."
    });
  });

  return app;
}
