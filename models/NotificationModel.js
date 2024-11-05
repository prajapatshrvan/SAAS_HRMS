const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  notification: { type: String },
  date: { type: String, default: new Date() },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
