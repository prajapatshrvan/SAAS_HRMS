const DocumentAddress = require("../../models/documentAddress.model");
const mongoose = require("mongoose");
const Employee = require("../../models/Employee.model");

module.exports.AddDocumentAddress = async (req, res) => {
  try {
    const {
      empid,
      company_name,
      line1,
      line2,
      line3,
      country,
      state,
      city,
      zip
    } = req.body;

    const existingAddress = await DocumentAddress.findOne({ company_name });
    if (existingAddress) {
      return res.status(409).json({
        message: "Address already exists for the provided company name"
      });
    }

    const documentAddress = new DocumentAddress({
      empId: empid,
      company_name: company_name,
      line1: line1,
      line2: line2,
      line3: line3,
      country: country,
      state: state,
      city: city,
      zip: zip
    });
    await documentAddress.save();

    res.status(200).json({ message: "success", address: documentAddress });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error."
    });
  }
};

module.exports.UpdateDocAddress = async (req, res) => {
  try {
    const { company_name, line1, line2, line3 } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid address ID"
      });
    }

    if (!company_name || !line1) {
      return res.status(400).json({
        message: "Company name and address line 1 are required"
      });
    }

    const updateFields = { company_name, line1, line2, line3 };

    const updatedAddress = await DocumentAddress.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({
        message: "Address not found"
      });
    }

    return res.status(200).send("Address updated successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.deleteDocAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ message: "Missing 'id' field in the request body" });
    }
    await DocumentAddress.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: "Document Address deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Delete successfully"
    });
  }
};

module.exports.documentAddressList = async (req, res) => {
  try {
    const list = await DocumentAddress.findOne();
    if (!list) {
      return res.status(404).json({ message: "No address found" });
    }
    return res.json({ list });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
};
