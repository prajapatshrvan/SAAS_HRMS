const hrdashboard = require("../controllers/hrDashboardController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.get("/hr/dashboard/allempdata", auth, hrdashboard.Empdata);
router.get("/hr/dashboard/employee/status", auth, hrdashboard.OnboardingStatus);
router.get(
  "/hr/dashboard/employee/attendace/status",
  auth,
  hrdashboard.empAttendaceStaus
);
router.get("/hr/dashboard/asset/status", auth, hrdashboard.allAssetStatus);
router.get("/hr/dashboard/department/count", auth, hrdashboard.departmentCount);
router.get("/hr/dashboard/employee/list", auth, hrdashboard.list);
router.get("/hr/dashboard/yearly/data", auth, hrdashboard.yearlydata);

module.exports = router;
