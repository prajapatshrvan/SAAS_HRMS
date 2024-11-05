const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    otp: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    failedAttempts: {
      type: Number,
      default: 0
    },
    firstFailedAttemptAt: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Otp", otpSchema);
