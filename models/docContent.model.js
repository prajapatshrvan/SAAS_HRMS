const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});
const content = mongoose.model("content", contentSchema);
module.exports = content;
