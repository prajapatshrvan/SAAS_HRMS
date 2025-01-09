// const http = require("http");
// const socketIo = require("socket.io");
// const app = require("./index");
// require("dotenv").config();

// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT"]
//   }
// });

// io.on("connection", socket => {
//   console.log("A user connected:", socket.id);

//   socket.on("join", empId => {
//     console.log(`Employee ${empId} joined room`);
//     socket.join(empId);
//   });

//   socket.on("broadcast", message => {
//     console.log("Broadcast message:", message);
//     socket.broadcast.emit("broadcast", message);
//   });

//   socket.on("personalMessage", ({ empId, message }) => {
//     console.log(`Sending personal message to ${empId}:`, message);
//     io.to(empId).emit("personalMessage", message);
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected:", socket.id);
//   });
// });

// module.exports = { server, io };
