const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  holiday_name: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  holiday_status: {
    type: String,
    default: "pending"
  }
});
const Holiday = mongoose.model("Holiday", holidaySchema);

module.exports = Holiday;
