const Employee = require("../models/Employee.model");
const { Auth_Middleware } = require("../AppConstants");
const jwt = require("jsonwebtoken");
const {
  getResourcesForUser
} = require("../utility/permit_utilities/user_permits_utility.js");

const auth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        message: Auth_Middleware.authorization_error
      });
    }
    const token = authorization.replace("Bearer ", "");
    const payload = jwt.decode(token, process.env.TOKEN_SECRET);
    if (!payload) {
      return res.status(401).json({
        message: Auth_Middleware.authorization_error
      });
    }

    if (payload.exp && payload.exp < Date.now() / 1000) {
      return res.status(401).json({
        message: Auth_Middleware.token_expire_message
      });
    }

    const user = await Employee.findById(payload.userObjectId);
    if (!user) {
      return res.status(401).json({
        message: Auth_Middleware.user_not_found_message
      });
    }
    req.user = payload;
    req.token = token;
    req.role_name = user.department;
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: Auth_Middleware.invalid_token_message
    });
  }
  next();
};

const checkAccess = (resourceName, action) => {
  return async (req, res, next) => {
    try {
      const userRoleMapping = {
        _id: req.user.userObjectId,
        userId: req.user.userId,
        role: req.user.role_name,
        inherits: req.user.userInheritedRoles
      };
      const userResources = await getResourcesForUser(userRoleMapping);
      console.log(userResources);

      if (
        userResources &&
        userResources[resourceName] &&
        userResources[resourceName].includes(action)
      ) {
        return next();
      }

      return res.status(403).json({ message: "Access denied" });
    } catch (error) {
      console.error("Error in checkAccessMiddleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

module.exports = {
  auth,
  checkAccess
};
