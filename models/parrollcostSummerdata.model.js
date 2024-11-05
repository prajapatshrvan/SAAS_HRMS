const mongoose = require("mongoose");

const payrollcostSchema = new mongoose.Schema(
  {
    totalctc: {
      type: Number,
    },
    totaltax: {
      type: Number,
    },
    deduction: {
      type: Number,
    },
    totalpf: {
      type: Number,
    },
    totalinsurance: {
      type: Number,
    },
    month: {
      type: String,
    },
    year: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PayrollCost = mongoose.model("PayrollCostData", payrollcostSchema);
module.exports = PayrollCost;
