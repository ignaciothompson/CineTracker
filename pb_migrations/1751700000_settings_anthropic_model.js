/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const settings = app.findCollectionByNameOrId("settings");
  settings.fields.add(new Field({
    name: "anthropic_model",
    type: "text",
  }));
  app.save(settings);
}, (app) => {
  const settings = app.findCollectionByNameOrId("settings");
  settings.fields.removeByName("anthropic_model");
  app.save(settings);
});
