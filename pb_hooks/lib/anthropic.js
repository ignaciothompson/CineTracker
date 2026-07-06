var ALLOWED_MODELS = {
  "claude-sonnet-5": true,
  "claude-haiku-4-5": true,
  "claude-haiku-4-5-20251001": true,
  "claude-sonnet-4-6": true,
  "claude-sonnet-4-5": true,
  "claude-sonnet-4-5-20250929": true,
  "claude-opus-4-6": true,
};
var DEFAULT_MODEL = "claude-sonnet-5";

function getSettingsRecord(app) {
  try {
    const recs = app.findRecordsByFilter("settings", "", "-id", 1, 0);
    if (recs.length) return recs[0];
  } catch (err) {}
  return null;
}

function getAnthropicKey() {
  try {
    const raw = $os.getenv("ANTHROPIC_API_KEY") || "";
    let key = String(raw).trim();
    if (!key) return "";
    if (
      (key.charAt(0) === '"' && key.charAt(key.length - 1) === '"') ||
      (key.charAt(0) === "'" && key.charAt(key.length - 1) === "'")
    ) {
      key = key.slice(1, -1).trim();
    }
    return key;
  } catch (err) {
    return "";
  }
}

function getAnthropicModel(app, requested) {
  if (requested && ALLOWED_MODELS[requested]) return requested;
  const rec = getSettingsRecord(app);
  if (rec) {
    const fromDb = rec.get("anthropic_model");
    if (fromDb && ALLOWED_MODELS[fromDb]) return fromDb;
  }
  try {
    const fromEnv = $os.getenv("ANTHROPIC_MODEL");
    if (fromEnv && ALLOWED_MODELS[fromEnv]) return fromEnv;
  } catch (err) {}
  return DEFAULT_MODEL;
}

function sanitizeRefItems(raw, max) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || (item.kind !== "tv" && item.kind !== "movie")) continue;
    const title = String(item.title || "").trim();
    if (!title) continue;
    out.push({ kind: item.kind, id: String(item.id || ""), title: title });
    if (out.length >= max) break;
  }
  return out;
}

function sanitizeGenres(raw, max) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const g = raw[i];
    if (!g) continue;
    let id = 0;
    let name = "";
    if (typeof g === "string") {
      name = g.trim();
    } else {
      id = Number(g.id) || 0;
      name = String(g.name || "").trim();
    }
    if (!name) continue;
    out.push({ id: id, name: name });
    if (out.length >= max) break;
  }
  return out;
}

function sanitizeSeedContext(raw) {
  const ctx = raw && typeof raw === "object" ? raw : {};
  return {
    last_watched: sanitizeRefItems(ctx.last_watched, 5),
    genres: sanitizeGenres(ctx.genres, 12),
    reference_titles: sanitizeRefItems(ctx.reference_titles, 10),
  };
}

function genreNames(genres) {
  if (!Array.isArray(genres)) return "";
  const names = [];
  for (let i = 0; i < genres.length; i++) {
    const g = genres[i];
    if (g && g.name) names.push(g.name);
    else if (typeof g === "string") names.push(g);
  }
  return names.join(", ");
}

function titleLine(record) {
  const title = record.get("title") || "sin titulo";
  const rating = record.get("rating");
  const genres = genreNames(record.get("genres"));
  let extra = genres;
  if (rating) extra = (extra ? extra + ", " : "") + rating + "/10";
  return title + (extra ? " (" + extra + ")" : "");
}

function buildLibraryContext(app) {
  let series = [];
  let movies = [];
  try {
    series = app.findRecordsByFilter("series", "", "-rating", 300, 0);
  } catch (err) {}
  try {
    movies = app.findRecordsByFilter("movies", "", "-rating", 300, 0);
  } catch (err) {}

  const visto = series
    .filter((r) => r.get("watch_status") === "visto")
    .map((r) => titleLine(r))
    .concat(movies.filter((r) => r.get("watch_status") === "visto").map((r) => titleLine(r)));

  const abandonadas = series
    .filter((r) => r.get("watch_status") === "abandonadas")
    .map((r) => titleLine(r))
    .concat(movies.filter((r) => r.get("watch_status") === "abandonadas").map((r) => titleLine(r)));

  const favoritas = series
    .filter((r) => r.get("is_favorite"))
    .map((r) => r.get("title"))
    .concat(movies.filter((r) => r.get("is_favorite")).map((r) => r.get("title")));

  return (
    "Biblioteca general:\n" +
    "- Terminados: " + (visto.join(", ") || "ninguno") + "\n" +
    "- Abandonados: " + (abandonadas.join(", ") || "ninguno") + "\n" +
    "- Favoritos: " + (favoritas.join(", ") || "ninguno")
  );
}

function buildFeedbackContext(app) {
  let buenas = [];
  let malas = [];
  try {
    buenas = app.findRecordsByFilter("ai_recommendations", "feedback = 'buena'", "-created", 20, 0);
  } catch (err) {}
  try {
    malas = app.findRecordsByFilter("ai_recommendations", "feedback = 'mala'", "-created", 20, 0);
  } catch (err) {}

  if (!buenas.length && !malas.length) return "Sin feedback previo sobre recomendaciones.";

  const lines = [];
  for (let i = 0; i < buenas.length; i++) {
    const r = buenas[i];
    lines.push(
      "- BUENA: eligio " +
        (r.get("chosen_title") || "?") +
        " | " +
        (r.get("recommendation_text") || "").slice(0, 120),
    );
  }
  for (let i = 0; i < malas.length; i++) {
    const r = malas[i];
    lines.push("- MALA: eligio " + (r.get("chosen_title") || "?") + " | evitar patron similar");
  }
  return "Feedback de recomendaciones anteriores:\n" + lines.join("\n");
}

function parseClaudeError(res) {
  let friendly = "Fallo la llamada a la API de Claude.";
  let code = "claude_error";
  let detail = res.raw || "";
  try {
    const errBody = res.json;
    const errMsg = (errBody.error && errBody.error.message) || detail;
    detail = errMsg;
    const lower = String(errMsg).toLowerCase();
    if (res.statusCode === 401 || (lower.includes("invalid") && lower.includes("key"))) {
      friendly = "La API key de Claude no es valida.";
      code = "invalid_key";
    } else if (
      res.statusCode === 402 ||
      lower.includes("credit") ||
      lower.includes("billing") ||
      lower.includes("insufficient")
    ) {
      friendly = "Tu cuenta de Anthropic no tiene creditos.";
      code = "no_credits";
    } else if (res.statusCode === 429) {
      friendly = "Anthropic esta limitando pedidos.";
      code = "rate_limit";
    }
  } catch (parseErr) {}
  return { error: friendly, code: code, detail: detail };
}

function formatRefList(items) {
  if (!items.length) return "ninguno";
  return items
    .map((i) => i.title + " (" + (i.kind === "tv" ? "serie" : "pelicula") + ")")
    .join(", ");
}

function formatGenreList(genres) {
  if (!genres.length) return "sin filtro de genero";
  return genres.map((g) => g.name).join(", ");
}

module.exports = {
  getAnthropicKey: getAnthropicKey,
  getAnthropicModel: getAnthropicModel,
  sanitizeSeedContext: sanitizeSeedContext,
  buildLibraryContext: buildLibraryContext,
  buildFeedbackContext: buildFeedbackContext,
  parseClaudeError: parseClaudeError,
  formatRefList: formatRefList,
  formatGenreList: formatGenreList,
};
