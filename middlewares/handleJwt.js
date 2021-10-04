const jwt = require("jsonwebtoken");

const generateJwt = (id) => {
  return new Promise((resolve, reject) => {
    const data = { uid: id };
    jwt.sign(
      data,
      process.env.SECRET_KEY,
      {
        expiresIn: "24h",
      },
      (error, token) => {
        if (error) {
          reject("Could not create token.");
        } else {
          resolve(token);
        }
      }
    );
  });
};

const validateJwt = (req, res, callback) => {
  const token = req.header("auth");
  if (!token) return res.json("Could not find token.");
  try {
    const { uid } = jwt.verify(token, process.env.SECRET_KEY);
    req.uid = uid;
  } catch (error) {
    res.json({ error: "Invaid token." });
  }
  callback();
};

module.exports = { generateJwt, validateJwt };
