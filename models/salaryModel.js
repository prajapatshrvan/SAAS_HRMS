const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    employeeID: {
      type: String
    },
    empname: {
      type: String
    },
    pf: {
      type: String
    },
    esi: {
      type: String
    },
    hra: {
      type: String
    },
    da: {
      type: String
    },
    advance_amount: {
      type: String
    },
    date: {
      type: String
    },
    month: {
      type: String
    },
    year: {
      type: String
    },

    payment_mode: {
      type: String,
      default: "bank"
    },
    payment_status: {
      type: Boolean,
      default: false
    },
    presentDay: {
      type: Number,
      default: 0
    },
    totalLeave: {
      type: Number,
      default: 0
    },
    unpaidLeave: {
      type: Number,
      default: 0
    },
    paidLeave: {
      type: Number
    },
    basicSalary: {
      type: Number
    },
    ta: {
      type: Number,
      default: 0
    },
    da: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    paydays: {
      type: String
    },
    bonus: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number
    },
    leaveDeduction: {
      type: Number,
      default: 0
    },
    miscellaneous: {
      type: Number,
      default: 0
    },
    totalCTC: {
      type: String
    },
    countPardaysalary: {
      type: String
    },
    monthlyAmount: {
      type: String
    },
    advanceSalary: {
      type: Number,
      default: 0
    },
    totaldeduction: {
      type: Number
    },
    description: {
      type: String
    },
    designation: {
      type: String
    },
    department: {
      type: String
    },
    date_of_joining: {
      type: String
    },
    pancard_No: {
      type: String
    },
    gender: {
      type: String
    },
    account_no: {
      type: String
    },
    remainingDays: {
      type: String
    },
    grossSalary: {
      type: String
    },
    totalGrossSalary: {
      type: String
    },
    absent_day: {
      type: String
    },

    totalnetsalary: {
      type: String
    },
    salary_status: {
      type: String,
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

const Salary = mongoose.model("Salary", salarySchema);

module.exports = Salary;
