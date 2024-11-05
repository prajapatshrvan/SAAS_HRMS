const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    assetname: {
      type: String,
    },

    assetId: {
      type: String,
    },

    // date_of_asset: {
    //   type: String,
    //   required: true,
    // },

    purchase_date: {
      type: String,
      required: true,
    },

    purchase_from: {
      type: String,
      required: true,
    },

    manufacturer: {
      type: String,
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    serial_number: {
      type: String,
      required: true,
    },

    supplier: {
      type: String,
      required: true,
    },

    condition: {
      type: String,
      required: false,
    },

    warranty: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },

    asset_user: {
      type: String,
      required: false,
    },

    description: {
      type: String,
    },

    // asset_status: {
    //   type: String,
    //   default: "unassigned",
    // },

    assign_to: {
      type: String,
      required: false,
      ref: "Employee",
    },

    assign_by: {
      type: String,
      ref: "Employee",
      required: false,
    },

    status: {
      type: String,
      default: "unAssigned",
    },

    verified: {
      type: String,
      default: "false",
    },

    image: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Asset = mongoose.model("Asset", userSchema);
module.exports = Asset;
