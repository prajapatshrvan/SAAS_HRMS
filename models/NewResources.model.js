const mongoose = require("mongoose");
const newResourcesSchema = new mongoose.Schema({
  resources: {
    type: String,
  },
});
const newResources = mongoose.model("newResources", newResourcesSchema);
module.exports = newResources;
