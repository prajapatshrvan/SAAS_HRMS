const mongoose = require("mongoose");

const SalarySlabSchema = new mongoose.Schema({
  minimum: {
    type: Number,
  },
  maximum: {
    type: Number,
    },
  hra: {
    type: Number,
    },
  pf: {
    type: Number,
    },
  insurance: {
    type: Number,
    
  },
  tax: {
    type : Number,
  }
  },
  {
  timestamps: true
  });

const Salaryslab = mongoose.model("Salaryslab", SalarySlabSchema);

module.exports = Salaryslab;
