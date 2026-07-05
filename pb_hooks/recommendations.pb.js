/// <reference path="../pb_data/types.d.ts" />

// GET /api/recommend
// Junta tu biblioteca (series + pelis vistas/calificadas) y le pide
// recomendaciones a Claude basadas en tu perfil real de espectador.
// Requiere la variable de entorno ANTHROPIC_API_KEY en el contenedor.

routerAdd("GET", "/api/recommend", (e) => {
  const apiKey = $os.getenv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return e.json(500, { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." });
  }

  let series = [];
  let movies = [];
  try {
    series = e.app.findRecordsByFilter("series", "", "-rating", 200, 0);
  } catch (err) {}
  try {
    movies = e.app.findRecordsByFilter("movies", "", "-rating", 200, 0);
  } catch (err) {}

  const seriaVista = series
    .filter(r => r.get("watch_status") === "visto")
    .map(r => `${r.get("title")} (${r.get("category") || "sin categorizar"}${r.get("rating") ? ", " + r.get("rating") + "/10" : ""})`);

  const seriaViendo = series
    .filter(r => r.get("watch_status") === "viendo")
    .map(r => r.get("title"));

  const peliculasVistas = movies
    .filter(r => r.get("watch_status") === "visto")
    .map(r => `${r.get("title")}${r.get("rating") ? " (" + r.get("rating") + "/10)" : ""}`);

  const favoritas = series.filter(r => r.get("is_favorite")).map(r => r.get("title"))
    .concat(movies.filter(r => r.get("is_favorite")).map(r => r.get("title")));

  const prompt = `Sos un curador de series y películas. Este es el perfil real de un espectador.

Series terminadas: ${seriaVista.join(", ") || "ninguna registrada"}
Series en curso: ${seriaViendo.join(", ") || "ninguna"}
Películas vistas: ${peliculasVistas.join(", ") || "ninguna registrada"}
Favoritas marcadas: ${favoritas.join(", ") || "ninguna"}

Recomendale 5 series o películas que probablemente le gusten, con una frase corta explicando el porqué de cada una en relación a su historial. Respondé en español, en una lista simple.`;

  const res = $http.send({
    method: "POST",
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (res.statusCode !== 200) {
    return e.json(502, { error: "Fallo la llamada a la API de Claude.", detail: res.raw });
  }

  const text = (res.json.content || []).map(b => b.text || "").join("\n");
  return e.json(200, { recommendation: text });
});
