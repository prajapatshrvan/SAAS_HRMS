const DocContent = require("../controllers/docContentController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/add/content", auth, DocContent.AddDocContent);

module.exports = router;
