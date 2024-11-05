const Role = require("../models/Role.model");
const Resources = require("../models/Resources.model");
const { roleLabels } = require("../Label");

module.exports.AddRole = async (req, res) => {
  try {
    const existingRole = await Role.findOne({ role: req.body.role });
    if (existingRole) {
      return res.status(400).json({
        message: roleLabels.role_exist_message,
      });
    } else {
      let rolekey = 1;
      let existrolekey;
      do {
        existrolekey = await Role.findOne({ rolekey: rolekey });
        if (existrolekey) {
          rolekey = rolekey + 1;
        }
      } while (existrolekey);

      const newRole = new Role({
        rolekey: rolekey,
        role: req.body.role,
      });

      const existingInherits = await Resources.findOne({ inherits: req.body.inherits });
      if (existingInherits) {
        return res.status(400).json({
          message: roleLabels.role_exist_message,
        });
      } else {
        const resources = new Resources({
          role_name: req.body.role,
          resources: {
            name: onboarding,
            action: ["create", "view"],
          },
          inherits: req.body.inherits,
        });

        await newRole.save();
        await resources.save();

        return res.status(200).json({
          message: roleLabels.role_create_message,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message,
    });
  }
};

module.exports.RoleList = async (req, res) => {
  try {
    const role = await Role.find();
    return res.status(200).json({
      role: role,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message,
    });
  }
};

module.exports.EditRole = async (req, res) => {
  try {
    const { role } = req.body;
    await Role.findByIdAndUpdate(req.body.id, {
      $set: {
        role,
        isActive,
      },
    });

    return res.status(200).json({
      message: roleLabels.role_edit_message,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message,
    });
  }
};
