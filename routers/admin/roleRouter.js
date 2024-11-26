const adminrole = require("../../controllers/admin/roleController");
const { auth } = require("../../middleware/AdminauthMiddleware");

const router = require("express").Router();
router.get("/role", auth, adminrole.ViewRole);
router.get("/permission", auth, adminrole.Permission);
router.get("/userprofile", auth, adminrole.UserProfile);
router.get("/actions", auth, adminrole.Actions);
router.get("/getActions", auth, adminrole.getActions);
router.get("/resourcesview", auth, adminrole.ResourcesView);
router.post("/addrole", auth, adminrole.AddRole);
router.post("/editinherits/:id", auth, adminrole.EditInherits);
router.post("/updatestatus", auth, adminrole.UpdateStatus);
router.post("/recourcesadd", auth, adminrole.AddResources);
router.post("/newrecourcesadd", auth, adminrole.NewResourcesAdd);
router.post("/newactionsadd", auth, adminrole.NewAddActions);
router.post("/editresources", auth, adminrole.EditResources);
router.get("/resourceslist", auth, adminrole.ResourcesList);

router.get("/resources", auth, adminrole.Resources);
router.get("/address", auth, adminrole.documentAddressList);

module.exports = router;
