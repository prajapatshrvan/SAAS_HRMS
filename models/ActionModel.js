const mongoose = require("mongoose");
const actionSchema = new mongoose.Schema({
  action: {
    type: String,
  },
});
const Action = mongoose.model("Action", actionSchema);
module.exports = Action;
