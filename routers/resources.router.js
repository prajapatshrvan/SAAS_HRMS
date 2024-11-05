const recources = require("../controllers/resourcesController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();
router.post("/recourcesadd", auth, recources.AddResources);
router.post("/roleinheritance", recources.RoleInHeritance);

module.exports = router;
