const mongoose = require("mongoose");

const WorkingtimeSchema = new mongoose.Schema(
  {
    updatedby: {
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
    check: [
      {
        _id: false,
        checkin: {
          type: Date,
          required: true
        },
        checkout: {
          type: Date
        }
      }
    ],
    breaks: [
      {
        breakStart: { type: Date, required: true },
        breakEnd: { type: Date },
        _id: false
      }
    ],
    overtime: { type: Number, default: 0 },
    breaktime: { type: Number, default: 0 },
    worktime: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Workingtime", WorkingtimeSchema);
