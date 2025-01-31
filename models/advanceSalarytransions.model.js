const mongoose = require("mongoose");

const advSalayTransionsSchema = new mongoose.Schema(
  {
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    advanceSalaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "advanceSalary",
      required: true
    },
    emiNumber: {
      type: Number,
      required: true,
      default: 0
    },
    totalEmiCount: {
      type: Number
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    emiAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);
const transionHistory = mongoose.model(
  "transionHistory",
  advSalayTransionsSchema
);
module.exports = transionHistory;
