const salary = require("../controllers/salaryController");
const cron = require("node-cron");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/create/salary", auth, salary.createSalary);
router.get("/salary/list", auth, salary.salaryList);
router.get("/emp/salary/list", auth, salary.EmployeeSalaryList);
router.patch("/update/salary", auth, salary.updatedSalary);
router.patch("/approved/salary", auth, salary.UpdateSalarystatus);
router.patch("/pay/salary", auth, salary.PaySalary);
router.patch("/change/status", auth, salary.Updatetatus);
router.get("/salaryslip", auth, salary.SalarySlip);
router.get("/trasiontion/history/list", auth, salary.trasitionHistoryList);

// cron job set
cron.schedule("0 0 26 * *", async () => {
  console.log("Running salary creation cron job...");
  try {
    await salary.createSalary(
      {},
      {
        status: code => ({
          json: response => console.log(`Status: ${code}`, response)
        })
      }
    );
  } catch (error) {
    console.error("Error running salary cron job:", error);
  }
});

module.exports = router;
