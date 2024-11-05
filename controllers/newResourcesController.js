const newResources = require("../models/NewResources.model");

module.exports.addResources = async (req, res) => {
  try {
    const { resources } = req.body;
    const existingResources = await newResources.findOne({ resources });

    if (existingResources) {
      return res.status(400).json({
        message: "Resources Already Exist",
      });
    }

    const newResourcesInstance = new newResources({
      resources,
    });

    await newResourcesInstance.save();

    return res.status(201).json({
      message: "Resources Added Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports.resourcesList = async (req, res) => {
  try {
    const resourceslists = await newResources.find();
    res.status(200).json({
      Resourceslist: resourceslists,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
