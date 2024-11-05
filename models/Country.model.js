const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema({
  strict: false,
  timestamps: true
});
const Country = mongoose.model("Country", CountrySchema);
module.exports = Country;
