const cache = require("memory-cache");
const Resources = require("../../models/Resources.model");

async function getResourcesForUser(userRoleMapping) {
  const cachedPermissions = cache.get(userRoleMapping.userId);

  if (cachedPermissions) {
    console.log("cachedPermissions ** for user Id : ", userRoleMapping.userId, cachedPermissions);
    return cachedPermissions;
  }

  const resources = await Resources.find();

  const userRole = userRoleMapping.role;

  if (!userRole) {
    console.error("User not found");
    return {};
  }

  const userResources = {};
  const roleResourcesMap = {};
  const visitedRoles = new Set();

  // Build a mapping of roles to resources
  resources.forEach((role) => {
    roleResourcesMap[role.role_name] = role.resources;
  });

  function traverse(roleName) {
    if (visitedRoles.has(roleName)) {
      console.warn(`Cyclic dependency detected for role: ${roleName}`);
      return;
    }

    visitedRoles.add(roleName);

    // Add resources for the current role
    roleResourcesMap[roleName]?.forEach((resource) => {
      const { name, actions } = resource;
      if (!userResources[name]) {
        userResources[name] = actions;
      } else {
        userResources[name].push(...actions);
      }
    });

    // Recursively traverse inherited roles
    resources
      .find((r) => r.role_name === roleName)
      ?.inherits.forEach((inheritedRole) => {
        traverse(inheritedRole);
      });
  }

  // Include the user's direct role and inherited roles in the traversal if inherits is defined
  if (userRoleMapping.inherits) {
    [userRole, ...userRoleMapping.inherits].forEach((role) => {
      traverse(role);
    });
  } else {
    traverse(userRole);
  }

  // Convert the userResources object to the desired format
  const formattedUserResources = {};
  Object.keys(userResources).forEach((resourceName) => {
    formattedUserResources[resourceName] = [...new Set(userResources[resourceName])];
  });

  // Cache the resolved permissions for future use for 10 minutes
  cache.put(userRoleMapping.userId, formattedUserResources, 10 * 60 * 1000);

  return formattedUserResources;
}

module.exports = { getResourcesForUser };
