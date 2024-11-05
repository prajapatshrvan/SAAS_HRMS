const mongoose = require("mongoose");

const headerfooter = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  header_image: {
    type: String,
    required: true,
  },
  footer_image: {
    type: String,
    required: true,
  },
});
const HeaderFooter = mongoose.model("HeaderFooter", headerfooter);
module.exports = HeaderFooter;
