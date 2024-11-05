const EmployeeDashBoard = require("../controllers/employeeDashboard.Controller.js");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.get("/personal/info", auth, EmployeeDashBoard.personalInfo);
router.post("/checkin/checkout", auth, EmployeeDashBoard.checkInAndCheckOut);
router.get("/working/hours", auth, EmployeeDashBoard.getWorkingHours);
router.get("/working/hours/list", auth, EmployeeDashBoard.workingHoursList);
router.get("/employee/currect/months/data", auth, EmployeeDashBoard.EmpCurrectMonthsData);
router.get("/emp/data", auth, EmployeeDashBoard.empdata);
router.get("/salary/details/byemployee", auth, EmployeeDashBoard.salarydetails);

module.exports = router;
