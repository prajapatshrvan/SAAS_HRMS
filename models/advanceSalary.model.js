const mongoose = require("mongoose");

const advanceSalarySchema = new mongoose.Schema(
  {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    advance_salary_type: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    emiNumber: {
      type: Number
    },
    paidAmount: {
      type: Number,
      default: 0,
      required: true
    },
    instalment: {
      type: Number,
      required: true
    },
    emi_amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String
    },
    attachment: {
      type: [String]
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
const AdvanceSalary = mongoose.model("AdvanceSalary", advanceSalarySchema);
module.exports = AdvanceSalary;
