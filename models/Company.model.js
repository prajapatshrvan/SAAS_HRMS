const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    companyid: {
      type: String,
      required: true
    },
    company_name: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model("Company", CompanySchema);
