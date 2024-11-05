const EmployeeDashBoard = require("../controllers/dashboardAttendanceController");
const { auth } = require("../middleware/AuthMiddleware");
const Employee = require("../models/Employee.model");
const router = require("express").Router();

//Employee Count // Leave Count
// router.get("/employeecount", auth, EmployeeDashBoard.TotalEmployee);
// router.get("/onleaveemployee", auth, EmployeeDashBoard.onleaveEmployee);
router.get("/holidaylist", auth, EmployeeDashBoard.HolidayList);
router.get("/monthly/leave", auth, EmployeeDashBoard.monthlyApprovedLeave);
// router.get("/today/leave/approved/list", auth, EmployeeDashBoard.todayApprovedLeave);
router.get("/list/employee", auth, EmployeeDashBoard.list);
router.get("/graph/year/list", auth, EmployeeDashBoard.yearlydata);
router.get("/graph/overall/leave", auth, EmployeeDashBoard.monthlyLeave);
module.exports = router;
