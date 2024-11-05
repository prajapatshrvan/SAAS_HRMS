const mongoose = require("mongoose");

const documentShema = new mongoose.Schema(
  {
    empId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    document_status: {
      type: String,
      default: "pending",
    },
    document: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentShema);
module.exports = Document;
