const mongoose = require("mongoose");
const { country } = require("../controllers/locationController");

const LocationSchema = new mongoose.Schema(
  {
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "countries",
      required: true
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "states",
      required: true
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cities",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Location = mongoose.model("Location", LocationSchema);
module.exports = Location;
