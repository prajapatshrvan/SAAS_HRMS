const role = require("../controllers/roleController");
const { auth } = require("../middleware/AuthMiddleware");

const router = require("express").Router();
router.post("/roleadd", auth, role.AddRole);
router.get("/rolelist", auth, role.RoleList);
router.post("/roleupdate", auth, role.EditRole);

module.exports = router;
