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
      type: Number
    },
    esi: {
      type: Number
    },
    hra: {
      type: Number
    },
    da: {
      type: Number
    },
    advance_amount: {
      type: Number
    },
    date: {
      type: String
    },
    month: {
      type: Number
    },
    year: {
      type: Number
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
      type: Number
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
      type: Number
    },
    countPardaysalary: {
      type: Number
    },
    monthlyAmount: {
      type: Number
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
      type: Number
    },
    remainingDays: {
      type: Number
    },
    grossSalary: {
      type: Number
    },
    totalGrossSalary: {
      type: Number
    },
    absent_day: {
      type: Number
    },
    pay_date: {
      tupe: Date
    },
    totalnetsalary: {
      type: Number
    },
    salary_status: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "approved"]
    }
  },
  {
    timestamps: true
  }
);

const Salary = mongoose.model("Salary", salarySchema);

module.exports = Salary;
