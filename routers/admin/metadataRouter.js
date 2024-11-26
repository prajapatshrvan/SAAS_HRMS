const metaData = require("../../controllers/admin/metadataController");
const { auth } = require("../../middleware/AdminauthMiddleware");
const router = require("express").Router();

router.post("/admin_metadata", auth, metaData.addMetadata);
router.get("/view_metadata", auth, metaData.getallMetaData);

router.get("/admin_department/:key", metaData.getDepartment);
router.get("/admin_add_department", metaData.addDepartment);

module.exports = router;
