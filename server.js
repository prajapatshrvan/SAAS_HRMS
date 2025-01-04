const http = require("http");
const socketIo = require("socket.io");
const app = require("./index");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", socket => {
  console.log("A user connected:", socket.id);

  socket.on("join", userId => {
    console.log(`User ${userId} joined`);
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`App is running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});
