const EmployeeDashBoard = require("../controllers/employeeDashboard.Controller.js");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.get("/personal/info", auth, EmployeeDashBoard.personalInfo);
router.get("/working/hours", auth, EmployeeDashBoard.getWorkingHours);
router.get("/working_time_list", auth, EmployeeDashBoard.workingHoursList);
router.get(
  "/employee/currect/months/data",
  auth,
  EmployeeDashBoard.EmpCurrectMonthsData
);
router.get("/emp/data", auth, EmployeeDashBoard.empdata);
router.get("/salary/details/byemployee", auth, EmployeeDashBoard.salarydetails);
router.post("/checkin/checkout", auth, EmployeeDashBoard.checkInAndCheckOut);
router.patch("/check_in_out_update", auth, EmployeeDashBoard.updateWorkingTime);
router.patch("/break_time", auth, EmployeeDashBoard.manageBreak);
router.get(
  "/current_day_birthdays",
  auth,
  EmployeeDashBoard.BirthdaysCurrentDay
);
router.get(
  "/current_month_birthdays",
  auth,
  EmployeeDashBoard.BirthdaysCurrentMonth
);

module.exports = router;
