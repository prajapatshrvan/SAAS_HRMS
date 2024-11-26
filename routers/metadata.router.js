const metaData = require("../controllers/metadataController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/metadata/add", auth, metaData.addMetadata);
router.get("/metadata", auth, metaData.getallMetaData);

router.get("/department/:key", metaData.getDepartment);
router.get("/add_department", metaData.addDepartment);

module.exports = router;
