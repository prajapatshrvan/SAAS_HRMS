const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      unique: true,
      required: true
    },

    firstname: {
      type: String
    },

    lastname: {
      type: String
    },

    mobile_number: {
      type: Number,

      min: 1000000000,
      max: 9999999999,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    token: [
      {
        type: String,
        default: null
      }
    ],
    inherits: [String]
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
