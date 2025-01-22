const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    username: {
      type: String,
      max: 50,
      required: true
    },
    password: {
      type: String,
      min: 6,
      max: 255,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Adminauth", schema);
