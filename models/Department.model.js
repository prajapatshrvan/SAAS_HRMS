const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true
    },
    data: []
  },
  {
    timestamps: true
  }
);

const Department = mongoose.model("Department", DepartmentSchema);
module.exports = Department;
