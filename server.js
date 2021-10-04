const express = require("express");
const mongoose = require("mongoose");
const app = express();

const cors = require("cors");

require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Database Connected! ✅");
  })
  .catch((error) => {
    console.log("Failed to Connect to Database! ❌");
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.options("*", cors());

app.use("/user", require("./routes/userRoutes"));
app.use("/pptr", require("./routes/pptrRoutes"));

app.listen(process.env.PORT, () => {
  console.log("Server is Running... ✅");
});
