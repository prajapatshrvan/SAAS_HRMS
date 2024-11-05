const mongoose = require("mongoose");

const ResourcesSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
    },
    resources: [
      {
        name: String,
        actions: [String],
      },
    ],
    inherits: [String],
  },
  {
    timestamps: true,
  }
);
const Resources = mongoose.model("Resources", ResourcesSchema);
module.exports = Resources;
