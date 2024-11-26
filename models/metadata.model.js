const mongoose = require("mongoose");

const metadataSchema = new mongoose.Schema({
  key: {
    type: Number,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    required: true
  }
});
const metaData = mongoose.model("metaData", metadataSchema);
module.exports = metaData;
