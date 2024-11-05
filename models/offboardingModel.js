const mongoose = require("mongoose");

const offboardingSchema = new mongoose.Schema(
  {
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    employeeID: {
      type: String
    },
    employeeName: {
      type: String
    },
    resignation_type: {
      type: String,
      required: true
    },
    notice_date: {
      type: String,
      required: true
    },
    resignation_date: {
      type: String,
      required: true
    },
    reason: {
      type: String
    },
    offboarding_status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "rejected", "cancelled", "InNoticePeriod", "completed"]
    },
    cooling_period: {
      type: String
    }
  },
  {
    timestamps: true
  }
);
const Offboarding = mongoose.model("Offboarding", offboardingSchema);
module.exports = Offboarding;
