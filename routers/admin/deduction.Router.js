const salary = require("../../controllers/admin/deductionsControllers");
const { auth } = require("../../middleware/AdminauthMiddleware");
const router = require("express").Router();

router.post("/add/salaryslab", salary.salarySlab);
router.patch("update/salaryslab/:id", salary.salarySlabupdate);
router.delete("delete/salaryslab/:id", salary.salarySlabDelete);

module.exports = router;
