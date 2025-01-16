const headerAndfooter = require("../controllers/header_footerController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/add/header/footer", auth, headerAndfooter.addheaderfooter);
router.post("/delete/header/footer", auth, headerAndfooter.deleteHeaderFooter);
router.get(
  "/header/footer/list",
  auth,
  headerAndfooter.CompanyHeaderFooterList
);

module.exports = router;
