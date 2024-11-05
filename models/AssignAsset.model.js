const mongoose = require("mongoose");

const assectSchema = new mongoose.Schema(
  {
    assetObject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
    },
    userObject: {
      type: String,
      ref: "Employee",
    },

    assignBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const AssetAssign = mongoose.model("AssetAssign", assectSchema);

module.exports = AssetAssign;
