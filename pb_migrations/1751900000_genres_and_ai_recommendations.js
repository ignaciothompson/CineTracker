/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  for (const name of ["series", "movies"]) {
    const col = app.findCollectionByNameOrId(name);
    col.fields.add(new Field({ name: "genres", type: "json" }));
    app.save(col);
  }

  const recs = new Collection({
    name: "ai_recommendations",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "recent_watched", type: "json" },
      { name: "genre_names", type: "json" },
      { name: "reference_items", type: "json" },
      { name: "ai_response", type: "text" },
      { name: "selected_title", type: "text" },
      { name: "feedback", type: "select", values: ["buena", "mala"], maxSelect: 1 },
    ],
  });
  app.save(recs);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("ai_recommendations")); } catch (e) {}
  for (const name of ["series", "movies"]) {
    const col = app.findCollectionByNameOrId(name);
    col.fields.removeByName("genres");
    app.save(col);
  }
});
