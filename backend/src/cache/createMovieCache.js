import path from "node:path";

import { FileMovieCache } from "./fileMovieCache.js";
import { JsonServerMovieCache } from "./jsonServerMovieCache.js";

export function createMovieCache({
  backendRoot,
  cacheDriver = "json-server",
  cacheTtlHours = 24,
  jsonServerUrl = "http://127.0.0.1:5001"
}) {
  if (cacheDriver === "file") {
    return new FileMovieCache({
      filePath: path.join(backendRoot, "data", "movies-cache.json"),
      ttlHours: cacheTtlHours
    });
  }

  return new JsonServerMovieCache({
    baseUrl: jsonServerUrl,
    ttlHours: cacheTtlHours
  });
}
