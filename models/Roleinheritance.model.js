const mongoose = require("mongoose");

const RoleinheritanceSchema = new mongoose.Schema({
    inheritance: {
        type: Object, 
    },
  },
  {
  timestamps: true
  });

const Roleinheritance = mongoose.model("Roleinheritance", RoleinheritanceSchema);

module.exports = Roleinheritance;
