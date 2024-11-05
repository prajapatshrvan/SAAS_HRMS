const role = require("../controllers/roleController");
const { auth } = require("../middleware/AuthMiddleware");

const router = require("express").Router();
router.post("/roleadd", role.AddRole);
router.get("/rolelist", role.RoleList);
router.post("/roleupdate", auth, role.EditRole);

module.exports = router;
