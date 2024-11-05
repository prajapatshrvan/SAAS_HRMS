const metaData = require("../controllers/metadataCountroller");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/metadata/add", auth, metaData.addMetadata);
router.get("/metadata", auth, metaData.getallMetaData);
router.get("/department/:key", auth, metaData.getDepartment);

module.exports = router;
