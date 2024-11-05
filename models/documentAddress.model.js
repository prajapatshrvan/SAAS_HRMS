const mongoose = require("mongoose");

const documnetAddress = new mongoose.Schema({
  // empId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   required: true,
  // },
  company_name: {
    type: String,
    required: true
  },
  line1: {
    type: String,
    required: false
  },
  line2: {
    type: String,
    required: false
  },
  line3: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  state: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  zip: {
    type: Number,
    required: false
  }
});
const DocumnetAddress = mongoose.model("DocumnetAddress", documnetAddress);
module.exports = DocumnetAddress;
