const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");
const { generateJwt } = require("../middlewares/handleJwt");

// basic methods //

//NOTES: terrible insecure
// get token from front end, decode jwt, THEN get user id
const getUsers = async (req, res) => {
  const allUsers = await User.find();
  try {
    return res.json(allUsers);
  } catch (error) {
    return res.json({ error: "NO_USERS" });
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  try {
    return res.json(user);
  } catch (error) {
    return res.json({ error: "NO_USER" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, { new: true });
  try {
    return res.json(user);
  } catch (error) {
    return res.json({ error: "CANNOT_UPDATE" });
  }
};

// authorization methods //

const userSignup = async (req, res) => {
  const emailAlreadyExists = await User.findOne({ email: req.body.email });
  if (emailAlreadyExists) {
    return res.json({ error: "EMAIL_IN_USE" });
  }
  const createdUser = await new User(req.body);
  try {
    createdUser.password = encrypt(req.body.password);
    createdUser.save();

    const token = await generateJwt(createdUser._id);
    const { _id } = createdUser;
    return res.json({ token, _id });
  } catch (error) {
    return res.json({ error: "CANT_CREATE_USER" });
  }
};

const userLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.json({ error: "USER_DOES_NOT_EXIST" });

  if (!isValidPassword(password, user.password))
    return res.json({ error: "INCORRECT_PASSWORD" });

  const token = await generateJwt(user._id);
  const { _id } = user;
  return res.json({ token, _id });
};

module.exports = {
  getUsers,
  getUser,
  userSignup,
  userLogin,
  updateUser,
};

// helpers //

const encrypt = (enteredPassword) => {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(enteredPassword, salt);
};

const isValidPassword = (enteredPassword, userPassword) => {
  return bcrypt.compareSync(enteredPassword, userPassword);
};
