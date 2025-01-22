const EmployeeDashBoard = require("../controllers/employeeDashboard.Controller.js");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.get("/personal/info", auth, EmployeeDashBoard.personalInfo);
router.get("/working/hours", auth, EmployeeDashBoard.getWorkingHours);
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
router.get("/working_time_list", auth, EmployeeDashBoard.workingHoursList);

router.get(
  "/working_hours_count_list",
  auth,
  EmployeeDashBoard.workingHoursCountList
);

router.get(
  "/working_time_list/week",
  auth,
  EmployeeDashBoard.Week_Working_Hours_List
);

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

router.get("/emp_work_anniversary", auth, EmployeeDashBoard.Work_Anniversary);

module.exports = router;
