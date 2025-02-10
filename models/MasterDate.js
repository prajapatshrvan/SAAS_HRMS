const mongoose = require("mongoose");

const dateSchema = new mongoose({
  cdate: {
    type: Date
  },
  timezone: {
    type: Number
  }
});
