const Resources = require("../models/Resources.model");
const Roleinheritance = require("../models/Roleinheritance.model");
const { recourcesLabels } = require("../Label");
const Role = require("../models/Role.model");

module.exports.AddResources = async (req, res) => {
  try {
    const role = await Role.findById(req.body.roleId);
    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }
    const newResources = new Resources({
      roleId: role._id,
      resources: {
        onboarding: req.body.resources.onboarding || [],
        leave: req.body.resources.leave || [],
        attendance_report: req.body.resources.attendance_report || [],
      },
    });
    await newResources.save();
    return res.status(200).json({
      message: recourcesLabels.resources_create_message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: recourcesLabels.internal_server_message,
    });
  }
};

module.exports.RoleInHeritance = async (req, res) => {
  try {
    const rolekey = req.body;
    const roles = await Role.find();
    const inheritance = {};

    roles.forEach((data) => {
      inheritance[data.role] = [];
    });
    for (const role in rolekey) {
      if (inheritance[role]) {
        rolekey[role].forEach((data) => {
          inheritance[role].push(data);
        });
      }
    }
    const existingRecord = await Roleinheritance.findOne();
    if (!existingRecord) {
      const roleinheritance = new Roleinheritance({
        inheritance: inheritance,
      });
      await roleinheritance.save();
      return res.status(200).json({
        message: "Success",
      });
    } else {
      existingRecord.inheritance = inheritance;
      await existingRecord.save();
      return res.status(200).json({
        message: "Update Success",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
