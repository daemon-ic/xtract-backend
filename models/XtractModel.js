const { Schema, model } = require("mongoose");

const XtractSchema = Schema({
  name: String,
  uid: String,
  result: {},
});

module.exports = model("Xtract", XtractSchema);
