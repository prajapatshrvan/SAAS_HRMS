const Company = require("../../models/Company.model");

function generateId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

console.log(generateId());

module.exports.AddRole = async (req, res) => {
  try {
    const existingRole = await Role.findOne({
      role: req.body.role.toUpperCase()
    });
    if (existingRole) {
      return res.status(400).json({
        message: roleLabels.role_exist_message
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
        role: req.body.role.toUpperCase()
      });
      const resources = new Resources({
        role_name: req.body.role.toUpperCase(),

        inherits: req.body.inherits
      });
      await newRole.save();
      await resources.save();

      return res.status(200).json({
        status: "success",
        message: roleLabels.role_create_message,
        role: newRole
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message
    });
  }
};
