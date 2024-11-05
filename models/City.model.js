const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema({
  strict: false,
  timestamps: true
});
const City = mongoose.model("City", CitySchema);
module.exports = City;
