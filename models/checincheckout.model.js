const mongoose = require("mongoose");

const WorkingHoursSchema = new mongoose.Schema({
  empid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  checkInTime: {
    type: Date,
    required: true,
  },
  checkOutTime: {
    type: Date,
  },
  date: {
    type: Date,
    required: true,
  },
  breakHours: {
    type: Number,
    default: 0,
  },
  breakMinutes: {
    type: Number,
    default: 0,
  },
  breakSeconds: {
    type: Number,
    default: 0,
  },
  hours: {
    type: Number,
    default: 0,
  },
  minutes: {
    type: Number,
    default: 0,
  },
  seconds: {
    type: Number,
    default: 0,
  },
  overtimeMinutes: {
    type: Number,
    default: 0,
  },
});

const Workingtime = mongoose.model("Workingtime", WorkingHoursSchema);

module.exports = Workingtime;
