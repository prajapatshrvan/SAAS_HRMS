const label = require("../../controllers/admin/labelController");
const router = require("express").Router()

router.get("/label", label.dasboardlabels);

module.exports = router