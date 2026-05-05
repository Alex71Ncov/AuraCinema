export class MovieNotFoundError extends Error {
  constructor(message = "Filmul nu a fost gasit.") {
    super(message);
    this.name = "MovieNotFoundError";
  }
}

export class ExternalApiError extends Error {
  constructor(message = "Serviciul extern nu a raspuns corect.") {
    super(message);
    this.name = "ExternalApiError";
  }
}

export class ConfigurationError extends Error {
  constructor(message = "Configuratia aplicatiei este incompleta.") {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class StorageError extends Error {
  constructor(message = "Stocarea aplicatiei nu este disponibila.", options = {}) {
    super(message, options);
    this.name = "StorageError";
  }
}
