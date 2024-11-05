const Action = require("../controllers/actionController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/addaction", auth, Action.addAction);
router.get("/actionlist", auth, Action.actionList);

module.exports = router;
