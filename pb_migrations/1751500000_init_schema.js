/// <reference path="../pb_data/types.d.ts" />

// CineTracker — esquema inicial
// Crea 3 colecciones: series, movies, lists
// Reglas abiertas (sin auth) a propósito: es una app personal, de un solo usuario,
// pensada para correr en un servidor propio detrás de tu propio dominio/red.
// Si en algún momento la exponés públicamente sin más protección, considerá
// ponerle un proxy con auth básica delante (Dokploy / Traefik lo soportan).

migrate((app) => {
  const series = new Collection({
    name: "series",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "tvtime_uuid", type: "text" },
      { name: "tvdb_id", type: "number" },
      { name: "imdb_id", type: "text" },
      { name: "title", type: "text", required: true },
      { name: "tvtime_status", type: "text" },
      { name: "watch_status", type: "select", values: ["pendientes", "viendo", "visto"], maxSelect: 1 },
      { name: "category", type: "select", values: ["Seria", "Comedia"], maxSelect: 1 },
      { name: "is_favorite", type: "bool" },
      { name: "seasons", type: "json" },
      { name: "rating", type: "number" },
      { name: "tmdb_id", type: "number" },
      { name: "poster_path", type: "text" },
      { name: "overview", type: "text" },
      { name: "notes", type: "text" }
    ]
  });
  app.save(series);

  const movies = new Collection({
    name: "movies",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "tvtime_uuid", type: "text" },
      { name: "tvdb_id", type: "number" },
      { name: "imdb_id", type: "text" },
      { name: "title", type: "text", required: true },
      { name: "year", type: "number" },
      { name: "watch_status", type: "select", values: ["pendientes", "viendo", "visto"], maxSelect: 1 },
      { name: "watched_at", type: "date" },
      { name: "is_favorite", type: "bool" },
      { name: "rewatch_count", type: "number" },
      { name: "rating", type: "number" },
      { name: "tmdb_id", type: "number" },
      { name: "poster_path", type: "text" },
      { name: "overview", type: "text" },
      { name: "notes", type: "text" }
    ]
  });
  app.save(movies);

  const lists = new Collection({
    name: "lists",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "tvtime_uuid", type: "text" },
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "is_public", type: "bool" },
      { name: "items", type: "json" }
    ]
  });
  app.save(lists);

  const settings = new Collection({
    name: "settings",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "tmdb_api_key", type: "text" }
    ]
  });
  app.save(settings);

}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("series")); } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("movies")); } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("lists")); } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("settings")); } catch (e) {}
});
