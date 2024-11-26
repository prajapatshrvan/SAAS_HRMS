const express = require("express");
const mongoose = require("mongoose");
const apiRouter = require("./api-router");
const adminRouter = require("./admin-router");
const createAdmin = require("./config/createAdmin");
const session = require("express-session");
// var timeout = require("connect-timeout");
// const compression = require("compression");
const cors = require("cors");
require("dotenv").config();

const IPAddredd = process.env.IP_ADDRESS;
const app = express();
// app.use(compression());

// app.use(timeout("30s"));

const result = createAdmin();
if (!result) {
  print("admin creation failed");
  process.exit();
}

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use("/uploads", express.static("uploads"));
const port = process.env.PORT || 5000;

const DB_CONNECT = process.env.MONGODB_CONNECTION;

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
// app.use(
//   "/framework",
//   express.static(path.join(__dirname, "/public/framework"))
// );

app.use(express.json());

mongoose.connect(DB_CONNECT);

mongoose.connection.on("connected", () => {
  console.log("Connected to mongo");
});
mongoose.connection.on("error", err => {
  console.error("Error connecting to mongo", err);
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

app.use("/", (req, res, next) => {
  res.status(404).send({ message: "Bad request" });
});

app.use((err, req, res, next) => {
  if (err.code == "ETIMEDOUT") {
    return res.status(408).send("Timeout");
  }

  req.connection.destroy();
  return res
    .status(err.status || 500)
    .send(err.message || "internal server error");
});

app.listen(port, IPAddredd, () => {
  console.log(`App is running on port ${port}`);
});
