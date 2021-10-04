const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  userSignup,
  userLogin,
  updateUser,
} = require("../controllers/userControllers");
const { validateJwt } = require("../middlewares/handleJwt");

router.get("/all", getUsers);

router.get("/get/:id", getUser);

router.post("/login", userLogin);

router.post("/signup", userSignup);

router.put("/update/:id", updateUser);

module.exports = router;
