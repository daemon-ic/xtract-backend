const { Schema, model } = require("mongoose");

const UserSchema = Schema({
  name: String,
  email: String,
  sites: [],
  password: String,
});

//hides information on get, needs to be reg function
UserSchema.methods.toJSON = function () {
  const { password, __v, ...user } = this.toObject();
  return user;
};

module.exports = model("User", UserSchema);


