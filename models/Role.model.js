const mongoose = require("mongoose")

const RoleSchema = new mongoose.Schema({
  rolekey: {
    type: Number,
    required : true
  },
  role: {
    type: String,
    required : true
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  },
 {
  timestamps: true,
 });
const Role = mongoose.model("Role", RoleSchema)

module.exports = Role