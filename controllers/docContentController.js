const Content = require("../models/docContent.model");

module.exports.AddDocContent = async (req, res) => {
  try {
    const { empid, subject, content } = req.body;

    const contentExits = await Content.findOne({ subject });
    if (contentExits) {
      return res.status(409).json({
        message: "content already exists",
      });
    }

    const newcontent = new Content({
      empId: empid,
      subject: subject,
      content: content,
    });
    await newcontent.save();

    res.status(200).json({ message: "success", newcontent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

module.exports.UpdateDocContent = async (req, res) => {
  try {
    const { id, content } = req.body;

    const emp = await Employee.findOne({ _id: req.user.userObjectId });
    const documnetContent = await Content.findOne({ _id: id });

    if (!emp) {
      return res.status(404).send("Employee not found");
    }

    if (!documnetContent) {
      return res.status(404).send("Document Content not found");
    }

    const updateFields = {
      content,
    };

    await Content.findByIdAndUpdate(id, { $set: updateFields });

    return res.status(200).json({
      message: "Content Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Servar Error",
    });
  }
};
