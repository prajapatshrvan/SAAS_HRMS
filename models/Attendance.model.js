const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    updateby: {
      type: mongoose.Schema.Types.ObjectId
    },
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model("Attendance", AttendanceSchema);
