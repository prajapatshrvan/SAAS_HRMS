const company = require("../../controllers/admin/companyController");
const { auth } = require("../../middleware/AdminauthMiddleware");
const router = require("express").Router();

router.post("/add_compamy", company.AddCompany);

module.exports = router;
