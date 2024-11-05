const Action = require("../models/ActionModel");

module.exports.addAction = async (req, res) => {
  try {
    const { action } = req.body;
    const existingaction = await Action.findOne({ action });

    if (existingaction) {
      return res.status(400).json({
        message: "Action Already Exist"
      });
    }
    const actions = new Action({
      action
    });
    await actions.save({ validateBeforeSave: false });
    return res.status(201).json({
      message: "Action Added Successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.actionList = async (req, res) => {
  try {
    const actionlist = await Action.find({});
    res.status(200).json({
      Action: actionlist
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
