const mongoose = require("mongoose");

const CitySChema = new mongoose.Schema(
  {},
  {
    strict: false,
  }
);

const StateSChema = new mongoose.Schema(
  {},
  {
    strict: false,
  }
);
const CountrySchema = new mongoose.Schema(
  {},
  {
    strict: false,
  }
);

const CityModal = mongoose.model("city", CitySChema);
const StateModal = mongoose.model("state", StateSChema);
const CountryModal = mongoose.model("country", CountrySchema);

module.exports = CountryModal;
module.exports = StateModal;
module.exports = CityModal;
