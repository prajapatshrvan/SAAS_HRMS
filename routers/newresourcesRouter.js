const newResources = require("../controllers/newResourcesController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/addresources", newResources.addResources);
router.get("/newresourceslist", auth, newResources.resourcesList);

module.exports = router;
