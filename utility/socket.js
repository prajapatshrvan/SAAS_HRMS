const socketIO = require("socket.io");
let io = null;

const initializeSocket = httpServer => {
  io = socketIO(httpServer);

  // Middleware for JWT authentication
  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const jwt = require("jsonwebtoken");
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) return next(new Error("Authentication error"));
      socket.user = user; // Attach user data to socket
      next();
    });
  });

  // Connection handler
  io.on("connection", socket => {
    console.log("A user connected:", socket.id);

    // Event listeners
    socket.on("join", empId => {
      console.log(`Employee ${empId} joined room`);
      socket.join(empId);
    });

    socket.on("broadcast", message => {
      console.log("Broadcast message:", message);
      socket.broadcast.emit("broadcast", message);
    });

    socket.on("personalMessage", ({ empId, message }) => {
      console.log(`Sending personal message to ${empId}:`, message);
      io.to(empId).emit("personalMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
};

const getSocketInstance = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

module.exports = { initializeSocket, getSocketInstance };
