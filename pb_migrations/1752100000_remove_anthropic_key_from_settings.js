/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const settings = app.findCollectionByNameOrId("settings");
  try {
    settings.fields.removeByName("anthropic_api_key");
    app.save(settings);
  } catch (e) {}
}, (app) => {
  const settings = app.findCollectionByNameOrId("settings");
  if (!settings.fields.getByName("anthropic_api_key")) {
    settings.fields.add(new Field({ name: "anthropic_api_key", type: "text" }));
    app.save(settings);
  }
});
