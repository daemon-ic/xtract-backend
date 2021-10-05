const { Schema, model } = require("mongoose");

const XtractSchema = Schema({
  uid: String,
  result: {},
});

module.exports = model("Xtract", XtractSchema);
