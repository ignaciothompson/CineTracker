/// <reference path="../pb_data/types.d.ts" />

function ensureAiRecommendations(app) {
  let col;
  try {
    col = app.findCollectionByNameOrId("ai_recommendations");
  } catch (e) {
    col = new Collection({
      name: "ai_recommendations",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [],
    });
  }

  const removeNames = [
    "recent_watched",
    "genre_names",
    "reference_items",
    "ai_response",
    "selected_title",
  ];
  for (let i = 0; i < removeNames.length; i++) {
    try {
      col.fields.removeByName(removeNames[i]);
    } catch (e) {}
  }

  if (!col.fields.getByName("seed_context")) {
    col.fields.add(new Field({ name: "seed_context", type: "json" }));
  }
  if (!col.fields.getByName("recommendation_text")) {
    col.fields.add(new Field({ name: "recommendation_text", type: "text" }));
  }
  if (!col.fields.getByName("chosen_title")) {
    col.fields.add(new Field({ name: "chosen_title", type: "text" }));
  }

  let feedback = col.fields.getByName("feedback");
  if (!feedback) {
    col.fields.add(
      new Field({
        name: "feedback",
        type: "select",
        values: ["sin_calificar", "buena", "mala"],
        maxSelect: 1,
      }),
    );
  } else {
    feedback.values = ["sin_calificar", "buena", "mala"];
  }

  app.save(col);
}

migrate((app) => {
  ensureAiRecommendations(app);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("ai_recommendations"));
  } catch (e) {}
});
