const AdvanceSalary = require("../controllers/advanceSalaryController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/advance/salary/create", auth, AdvanceSalary.createAdvanceSalary);
router.post("/advance/salary/status", auth, AdvanceSalary.AdvanceSalaryStatus);
router.get("/advance/salary/list", auth, AdvanceSalary.advanceSalaryList);
router.get("/advance/salary/:id", auth, AdvanceSalary.advanceSalarybyId);

module.exports = router;
