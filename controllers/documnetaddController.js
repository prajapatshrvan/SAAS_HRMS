const DocumnetAddress = require("../models/documentAddress.model");
const Employee = require("../models/Employee.model");

module.exports.AddDocumentAddress = async (req, res) => {
  try {
    const { empid, company_name, line1, line2, line3, country, state, city, zip } = req.body;

    const existingAddress = await DocumnetAddress.findOne({ company_name });
    if (existingAddress) {
      return res.status(409).json({
        message: "Address already exists for the provided company name",
      });
    }

    const documentAddress = new DocumnetAddress({
      empId: empid,
      company_name: company_name,
      line1: line1,
      line2: line2,
      line3: line3,
      country: country,
      state: state,
      city: city,
      zip: zip,
    });
    await documentAddress.save();

    res.status(200).json({ message: "success", address: documentAddress });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

module.exports.UpdateDocAddress = async (req, res) => {
  try {
    const { id, company_name, line1, line2, line3, country, state, city, zip } = req.body;

    const emp = await Employee.findOne({ _id: req.user.userObjectId });
    const documentAddress = await DocumnetAddress.findOne({ _id: id });

    if (!emp) {
      return res.status(404).send("Employee not found");
    }

    if (!documentAddress) {
      return res.status(404).send("Document address not found");
    }

    const updateFields = {
      company_name,
      line1,
      line2,
      line3,
      country,
      state,
      city,
      zip,
    };

    await DocumnetAddress.findByIdAndUpdate(id, { $set: updateFields });

    return res.status(200).json({
      message: "Address updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports.deleteDocAddress = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Missing 'id' field in the request body" });
    }
    const documnet = await DocumnetAddress.findOneAndDelete({ _id: id });
    if (!documnet) {
      return res.status(404).json({ message: "Document Address not found" });
    }
    res.status(200).json({ message: "Document Address deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Delete successfully",
    });
  }
};

module.exports.documnetAddressList = async (req, res) => {
  try {
    const list = await DocumnetAddress.find();
    return res.status(200).json({
      List: list,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "INternal Server Error",
    });
  }
};
