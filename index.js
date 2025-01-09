const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const { initializeSocket } = require("./utility/socket");
require("dotenv").config();

const app = express();
const http = require("http").createServer(app);

// Initialize Socket.IO
initializeSocket(http);

const PORT = process.env.PORT || 5000;

// Admin creation
const createAdmin = require("./config/createAdmin");
createAdmin();

// CORS setup
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200
};
app.use(cors(corsOptions));

// Static file serving
app.use("/uploads", express.static("uploads"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_CONNECTION);
mongoose.connection.on("connected", () => console.log("Connected to MongoDB"));
mongoose.connection.on("error", err => console.error("MongoDB Error:", err));

// Session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
  })
);

// Routers
const apiRouter = require("./api-router");
const adminRouter = require("./admin-router");
apiRouter(app);
adminRouter(app);

// 404 handler
app.use("/", (req, res) => {
  res.status(404).send({ message: "Bad request" });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.code === "ETIMEDOUT") {
    return res.status(408).send("Timeout");
  }
  req.connection.destroy();
  res.status(err.status || 500).send(err.message || "Internal Server Error");
});

// Start server
http.listen(PORT, "0.0.0.0", () => {
  console.log(`App is running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});
