const mongoose = require("mongoose");

const logo = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  logo_image: {
    type: String,
    required: true,
  },
  company_name: {
    type: String,
    required: true,
  },
});
const Logo = mongoose.model("Logo", logo);
module.exports = Logo;
