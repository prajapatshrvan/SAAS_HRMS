const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema(
  {
    Key: {
      type: Number,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const Status = mongoose.model("Status", StatusSchema);
module.exports = Status;
