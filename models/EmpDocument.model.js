const mongoose = require("mongoose");

const EmpDocumentSchema = new mongoose.Schema(
  {
    empid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    secondary_passing: {
      type: String
    },
    senior_passing: {
      type: String
    },
    bachelor_passing: {
      type: String
    },
    secondary_doc: {
      type: String
    },
    senior_doc: {
      type: String
    },
    bachelor_doc: {
      type: String
    },

    companyname: { type: String, required: false },
    start_date: { type: String, required: false },
    end_date: { type: String, required: false },

    extraExperienceData: [
      {
        companyname: { type: String, required: false },
        start_date: { type: String, required: false },
        end_date: { type: String, required: false },
        compensation: { type: String, required: false },
        experienceletter: { type: String, required: false },
        offerletter: { type: String, required: false },
        payslip: { type: String, required: false },
        relievingletter: { type: String, required: false },
        resignationletter: { type: String, required: false }
      }
    ],

    experienceData: [
      {
        companyname: { type: String, required: false },
        start_date: { type: String, required: false },
        end_date: { type: String, required: false },
        compensation: { type: String, required: false },
        experienceletter: { type: String, required: false },
        offerletter: { type: String, required: false },
        payslip: { type: String, required: false },
        relievingletter: { type: String, required: false },
        resignationletter: { type: String, required: false }
      }
    ],

    extra: [
      {
        degreeField: { type: String, required: false },
        degreepercent: { type: String, required: false },
        degreefile: { type: String, required: false }
      }
    ]
  },
  {
    timestamps: true
  }
);
const EmpDocument = mongoose.model("Empdocument", EmpDocumentSchema);
module.exports = EmpDocument;
