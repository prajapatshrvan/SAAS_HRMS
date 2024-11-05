const {
  candidateDetails,
  candidateAddressDetails,
  candidateDocuments,
  candidateAllData
} = require("../controllers/admin/candidateDetails.js");
const employee = require("../controllers/employeeController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();
router.post("/addemployee", auth, employee.EmployeeAdd);
router.post("/updateemployee", auth, employee.updateEmployee);
router.post("/addempaddress", auth, employee.EmployeeAddress);
router.post("/addempdocument", auth, employee.Employeedocument);
router.post("/bankdetail", auth, employee.addBankDetails);
router.post("/ctcdetails", auth, employee.addctcdetails);
router.get("/employeelist", auth, employee.EmployeeList);
router.get("/employeelist/:status", auth, employee.EmployeeList);
// router.post("/employeedoc", auth, employee.employeeDoc);
router.post("/adddepartment", auth, employee.adddepartment);
router.post("/updatestatus", auth, employee.employeeStatus);

router.get("/candidateDetails/:empid", auth, candidateDetails);
router.get("/candidateAddressDetails/:empid", auth, candidateAddressDetails);
router.get("/candidatedocuments/:empid", auth, candidateDocuments);
router.get("/candidateAllData/:empid", auth, candidateAllData);
// router.get("/employeedetails/:email", auth, employee.employeeDetails);
// router.get("/employeedocs/:empId", auth, employee.employeeDocs);

module.exports = router;
