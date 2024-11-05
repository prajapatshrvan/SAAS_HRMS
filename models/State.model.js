const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema({
  strict: false,
  timestamps: true
});
const State = mongoose.model("State", StateSchema);
module.exports = State;
