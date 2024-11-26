const user = require("../controllers/authController");
const { auth } = require("../middleware/AuthMiddleware");
const {
  attendance,
  updateAttendance,
  attendanceReport,
  attendanceWeekReport,
  todayAttendanceData,
  TotalEmployee
} = require("../controllers/attendanceController.js");
const router = require("express").Router();

router.post("/register", user.register);
router.post("/login", user.employeeLogin);
// router.post("/login", user.userLogin);
router.post("/changepassword", auth, user.changePassword);
router.post("/forgotpassword", user.forgotPassword);
router.post("/resendotp", user.resendOtp);
router.post("/verifyotp", user.verifyOtp);
router.post("/resetpassword", user.resetPassword);
router.post("/logout", auth, user.logout);
router.post("/logoutall", auth, user.logOutAll);
router.get("/userinfo", auth, user.userInfo);
router.post("/attendance", auth, attendance);
router.patch("/update/attendance", auth, updateAttendance);
router.get("/attendance", auth, attendanceReport);
router.get("/week_attendance", auth, attendanceWeekReport);
router.get("/oneday_attendance", auth, todayAttendanceData);
router.get("/employeecount", auth, TotalEmployee);

router.get("/roles", auth, user.ViewRoleApi);

module.exports = router;
