const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema(
  {
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    type: {
      type: String,
      required: true
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
    leave_days: {
      type: Number,
      required: true
    },
    reason: {
      type: String
    },
    document: {
      type: String
    },
    session: {
      type: String
    },
    requestto: {
      type: String
    },
    status: {
      type: String,
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);
const Leave = mongoose.model("Leave", LeaveSchema);
module.exports = Leave;
