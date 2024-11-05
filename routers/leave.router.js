const Leave = require("../controllers/leaveController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/createleave", auth, Leave.createLeave);
router.post("/leaveapproved", auth, Leave.ApprovedLeave);
router.get("/leavelist", auth, Leave.leaveList);
router.get("/approvedleavelist", auth, Leave.leaveApprovedList);
router.get("/pendingleavelist", auth, Leave.leavePendingList);
router.post("/leavedelete", auth, Leave.leaveDelete);

module.exports = router;
