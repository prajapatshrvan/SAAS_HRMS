const mongoose = require("mongoose");

const exceldata = new mongoose.Schema(
  {
    excelfile: {
      type: String,
    },
    data: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("exceldata", exceldata);
