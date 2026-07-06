/// <reference path="../pb_data/types.d.ts" />

// POST /api/chat — recomendación con seed_context estructurado.
// Helpers en lib/anthropic.js — cada handler hace require() adentro (scope aislado).

routerAdd("GET", "/api/chat/status", (e) => {
  const lib = require(__hooks + "/lib/anthropic.js");
  let key = "";
  let source = "none";

  try {
    key = lib.getAnthropicKey();
    if (key) source = "env";
  } catch (err) {
    key = "";
    source = "none";
  }

  return e.json(200, {
    configured: !!key,
    source: source,
  });
});

routerAdd("POST", "/api/chat", (e) => {
  const lib = require(__hooks + "/lib/anthropic.js");

  const apiKey = lib.getAnthropicKey();
  if (!apiKey) {
    return e.json(500, {
      error: "Falta ANTHROPIC_API_KEY en el servidor (variable de entorno).",
    });
  }

  let body = {};
  try {
    body = JSON.parse(readerToString(e.request.body));
  } catch (parseErr) {
    return e.json(400, { error: "Cuerpo JSON invalido." });
  }

  const seed = lib.sanitizeSeedContext(body.seedContext || body);
  const model = lib.getAnthropicModel(e.app, body.model || "");

  const libraryContext = lib.buildLibraryContext(e.app);
  const feedbackContext = lib.buildFeedbackContext(e.app);

  const userPrompt =
    "Pedido de recomendacion con estos datos:\n" +
    "1) Ultimos vistos: " + lib.formatRefList(seed.last_watched) + "\n" +
    "2) Generos deseados: " + lib.formatGenreList(seed.genres) + "\n" +
    "3) Referencias de biblioteca: " + lib.formatRefList(seed.reference_titles) + "\n\n" +
    "Recomenda entre 3 y 5 titulos concretos (series o peliculas) en espanol. " +
    "Para cada uno: titulo + una frase de por que encaja. " +
    "Prioriza generos y referencias sobre historial general. " +
    "No recomiendes cosas muy parecidas a abandonados salvo que se lo pidan.";

  const systemPrompt =
    "Sos curador de cine y series. Respondes en espanol, claro y util.\n\n" +
    libraryContext + "\n\n" + feedbackContext + "\n\n" +
    "Reforza patrones de recomendaciones BUENAS. Evita errores de las MALAS.";

  const res = $http.send({
    method: "POST",
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (res.statusCode !== 200) {
    const err = lib.parseClaudeError(res);
    return e.json(502, err);
  }

  const text = (res.json.content || []).map((b) => b.text || "").join("\n");
  return e.json(200, { reply: text, model: model });
});
