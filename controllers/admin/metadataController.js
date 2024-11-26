const metaData = require("../../models/metadata.model");
const Department = require("../../models/Department.model");
const { auth } = require("../../middleware/AdminauthMiddleware");

module.exports.addMetadata = async (req, res) => {
  try {
    const { type, value } = req.body;
    const leaveExists = await metaData.findOne({ value: value });

    if (leaveExists) {
      return res.status(409).json({ message: "Value Already Exists" });
    }
    let key = 1;
    let existingLeave;
    do {
      existingLeave = await metaData.findOne({ key: key });
      if (existingLeave) {
        key += 1;
      }
    } while (existingLeave);
    const metadata = new metaData({
      key,
      value,
      type
    });
    await metadata.save();
    return res.status(200).json({
      message: "Created Successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.getallMetaData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const metadata = await metaData
      .find()
      .sort({ key: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await metaData.countDocuments();

    const totalPages = Math.ceil(totalCount / limit);

    return res.render("metadata", {
      metadata,
      currentPage: page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.addDepartment = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data[0]) {
      return res
        .status(400)
        .json({ error: "Type and data are required fields." });
    }

    const existingDepartment = await Department.findOne({ type });
    if (existingDepartment) {
      if (existingDepartment.data.includes(data)) {
        return res.status(400).json({ message: "This value already exists" });
      }
      existingDepartment.data.push(data);
      await existingDepartment.save();

      return res.status(200).json({ message: "Value added successfully" });
    } else {
      const department = new Department({
        type: type,
        data: data
      });

      await department.save();
      return res.status(201).json({ message: "Value added successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports.getDepartment = async (req, res) => {
  try {
    const key = req.params.key;
    const depart = await Department.findOne({ type: key });

    if (!depart) {
      return res.status(400).json({ message: "data not found" });
    }
    const data = depart.data.map(item => item);

    return res.status(200).json({
      data: data
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
