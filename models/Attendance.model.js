const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    updateby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
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
      type: String,
      enum: ["present", "absent", "half_leave", "full_leave", "quarter_leave"],
      required: true
    }
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model("Attendance", AttendanceSchema);
