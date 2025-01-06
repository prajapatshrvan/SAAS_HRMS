const express = require("express");
const mongoose = require("mongoose");
const apiRouter = require("./api-router");
const adminRouter = require("./admin-router");
const createAdmin = require("./config/createAdmin");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

const result = createAdmin();
if (!result) {
  console.error("Admin creation failed");
  process.exit();
}

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use("/uploads", express.static("uploads"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.json());

mongoose.connect(process.env.MONGODB_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", err => {
  console.error("Error connecting to MongoDB:", err);
});

app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

apiRouter(app);
adminRouter(app);

app.use("/", (req, res) => {
  res.status(404).send({ message: "Bad request" });
});

app.use((err, req, res, next) => {
  if (err.code === "ETIMEDOUT") {
    return res.status(408).send("Timeout");
  }
  req.connection.destroy();
  res.status(err.status || 500).send(err.message || "Internal Server Error");
});

module.exports = app;
