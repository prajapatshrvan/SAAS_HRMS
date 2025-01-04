const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
