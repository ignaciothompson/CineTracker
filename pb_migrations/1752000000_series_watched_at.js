/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const series = app.findCollectionByNameOrId("series");
  if (!series.fields.getByName("watched_at")) {
    series.fields.add(new Field({ name: "watched_at", type: "date" }));
    app.save(series);
  }
}, (app) => {
  const series = app.findCollectionByNameOrId("series");
  try {
    series.fields.removeByName("watched_at");
    app.save(series);
  } catch (e) {}
});
