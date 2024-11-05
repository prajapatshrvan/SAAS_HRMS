const manageFund = require("../controllers/managefundController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

// router.get("/count/employee", auth, manageFund.totalEmployee);
// router.get("/total/workingday", auth, manageFund.totalWorkingDays);
// router.get("/total/netsalary", auth, manageFund.countNetSalary);
// router.get("/payrollcostsummer", auth, manageFund.payrollCostSummer);
// router.get("/payrollsummery", auth, manageFund.payrollSummery);

router.get("/managefund/dashboard/staticData", auth, manageFund.manageFundDashboardStaticData);
// router.get("/payroll/list", auth, manageFund.payrolllist);
router.get("/payroll/view", auth, manageFund.payrolllistView);

//manageFund payroll Page Apis
router.get("/payroll/page/payrollcost/employeecost", auth, manageFund.payrollcostandemployeepay);
router.get("/total/payDays", auth, manageFund.totalPayDays);
router.get("/total/netsalary", auth, manageFund.countNetSalary);
// router.get("/total/deduction", auth, manageFund.totaldeduction);

module.exports = router;
