/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("ai_recommendations");
  if (!collection.fields.getByName("created")) {
    collection.fields.add(new Field({ name: "created", type: "autodate", onCreate: true }));
  }
  if (!collection.fields.getByName("updated")) {
    collection.fields.add(
      new Field({ name: "updated", type: "autodate", onCreate: true, onUpdate: true }),
    );
  }
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("ai_recommendations");
  try {
    collection.fields.removeByName("created");
  } catch (e) {}
  try {
    collection.fields.removeByName("updated");
  } catch (e) {}
  app.save(collection);
});
