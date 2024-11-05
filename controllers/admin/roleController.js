const Role = require("../../models/Role.model");
const Resources = require("../../models/Resources.model");
const NewResources = require("../../models/NewResources.model");
const Action = require("../../models/ActionModel");
const Employee = require("../../models/Employee.model");
const DocumentAddress = require("../../models/documentAddress.model");
const { roleLabels, recourcesLabels } = require("../../Label");
const newResources = require("../../models/NewResources.model");

module.exports.ViewRole = async (req, res) => {
  try {
    const roles = await Resources.aggregate([
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "role",
          as: "resources"
        }
      }
    ]);

    const role = await Role.find();

    const inheritance = await Resources.distinct("inheritance");

    return res.render("role", {
      roles: roles,
      role: role,
      inheritance: inheritance
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

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

module.exports.EditInherits = async (req, res) => {
  try {
    const id = req.params.id;
    const { inherits } = req.body;

    if (!inherits) {
      return res.status(400).json({
        message: "Invalid or missing 'inherits' value"
      });
    }
    if (typeof inherits === "string") {
      inherits = inherits.split(",");
    } else if (!Array.isArray(inherits)) {
      return res.status(400).json({
        message: "Invalid 'inherits' value. It should be either a comma-separated string or an array."
      });
    }
    const inheritValues = Array.from(new Set(inherits));
    await Resources.findByIdAndUpdate(id, {
      $set: { inherits: inheritValues }
    });

    return res.status(200).json({
      message: "Resource updated successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.AddResources = async (req, res) => {
  try {
    const { role_name, resources } = req.body;

    if (!role_name) {
      return res.status(400).json({ message: "Role name is missing" });
    }
    const role = await Resources.findOne({ role_name });

    if (!role) {
      return res.status(400).json({ message: "Role not found" });
    }
    if (!resources || !Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ message: "Resources are missing or invalid" });
    }
    for (const resource of resources) {
      const resourceNameLowerCase = resource.name.toLowerCase();
      const existingResource = role.resources.find((res) => res.name === resourceNameLowerCase);

      if (!existingResource) {
        role.resources.push({
          name: resourceNameLowerCase,
          actions: resource.actions
        });
      } else {
        existingResource.actions = resource.actions;
      }
    }
    await role.save();

    return res.status(200).json({ message: "Resources added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.NewResourcesAdd = async (req, res) => {
  try {
    const { resources } = req.body;

    const existingResources = await newResources.findOne({ resources });

    if (existingResources) {
      return res.status(400).json({
        message: "Resources already exist"
      });
    }

    const newResourcesInstance = new newResources({
      resources
    });

    await newResourcesInstance.save();

    return res.status(201).json({
      message: "Resources Added Successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.NewAddActions = async (req, res) => {
  try {
    const { action } = req.body;

    const existingActions = await Action.findOne({ action });
    if (existingActions) {
      return res.status(400).json({
        message: "Action already exists"
      });
    }

    const newActionsInstance = new Action({
      action
    });

    await newActionsInstance.save();

    res.status(200).json({
      message: "Action Added Successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.EditResources = async (req, res) => {
  try {
    const roleName = req.query.role;
    const resources = req.body.resources;

    const resource_id = resources._id;
    const newActions = resources.actions.filter((action, index, self) => index === self.findIndex((a) => a === action));

    let newResources = {
      name: resources.name,
      actions: newActions
    };

    const updatedResources = await Resources.findOneAndUpdate(
      { role_name: roleName, "resources._id": resource_id },
      { $set: { "resources.$": newResources } }
    );

    if (!updatedResources) {
      return res.status(404).json({ error: "Resources not updated" });
    }

    return res.status(200).json({ message: "Resources updated successfully", updatedResources });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.UserProfile = async (req, res) => {
  try {
    // const employees = await Employee.find({ status: "completed" });
    return res.render("userprofile", {
      employees: "Demo"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message
    });
  }
};

module.exports.ResourcesView = async (req, res) => {
  try {
    const newresourceslist = await NewResources.find();
    const action = await Action.find();

    const resources = await Resources.find({ role_name: req.query.role });
    return res.render("resourcesview", {
      resources,
      newresourceslist,
      action
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message
    });
  }
};

module.exports.Actions = async (req, res) => {
  try {
    const action = await Action.find();
    const resources = await Resources.find({ role_name: req.query.role });
    return res.render("actions", {
      resources,
      action
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: roleLabels.internal_server_message
    });
  }
};

module.exports.Resources = async (req, res) => {
  try {
    const newresourceslist = await NewResources.find();
    const resources = await Resources.find();
    return res.render("resources", { resources, newresourceslist });
  } catch (error) {
    console.log(error);
  }
};

module.exports.Permission = async (req, res) => {
  try {
    const resources = await Resources.find();
    return res.render("permission", { resources });
  } catch (error) {
    console.log(error);
  }
};

module.exports.ResourcesList = async (req, res) => {
  try {
    const mainRole = await Resources.findOne({ role_name: req.body.role_name });
    if (!mainRole) {
      return res.status(404).json({
        message: "Role not found"
      });
    }
    let inherits = [];
    for (const role of mainRole.inherits) {
      const roleResources = await Resources.find({ role_name: role });
      if (roleResources) {
        inherits.push(...roleResources[0].resources);
      }
    }

    return res.send(inherits);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.UpdateStatus = async (req, res) => {
  try {
    const { id, isActive } = req.body;
    const updatedRole = await Role.findByIdAndUpdate(id, {
      $set: { isActive: !!isActive }
    });

    if (!updatedRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res.status(200).json({
      message: `isActive updated to ${isActive} successfully`
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.documentAddressList = async (req, res) => {
  try {
    const list = await DocumentAddress.find();
    if (!list) {
      return res.status(404).json({ message: "No address found" });
    }
    return res.render("docAddress", { list });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
};
