const logo = require("../controllers/logoController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/addlogo", auth, logo.addCompanyLogo);
router.post("/update/logo", auth, logo.updateCompanyLogo);
router.post("/delete/logo", auth, logo.deleteCompanyLogo);
router.get("/companylogo/list", auth, logo.CompanyLogoList);

module.exports = router;
