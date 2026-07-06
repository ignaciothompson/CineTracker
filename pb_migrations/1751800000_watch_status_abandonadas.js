/// <reference path="../pb_data/types.d.ts" />

const STATUS_VALUES = ["pendientes", "viendo", "visto", "abandonadas"];
const STATUS_VALUES_ROLLBACK = ["pendientes", "viendo", "visto"];

function setWatchStatusValues(app, values) {
  for (const name of ["series", "movies"]) {
    const col = app.findCollectionByNameOrId(name);
    const field = col.fields.getByName("watch_status");
    field.values = values;
    app.save(col);
  }
}

migrate((app) => {
  setWatchStatusValues(app, STATUS_VALUES);
}, (app) => {
  setWatchStatusValues(app, STATUS_VALUES_ROLLBACK);
});
