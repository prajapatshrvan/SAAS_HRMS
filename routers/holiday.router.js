const Holiday = require("../controllers/holidayController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/addbulkholiday", auth, Holiday.addBulkHoliday);
router.post("/update/holiday", auth, Holiday.UpdateHoliday);
router.post("/holiday/status", auth, Holiday.HolidayStatus);
router.post("/deleteholiday", auth, Holiday.deleteHoliday);
router.get("/holiday/list", auth, Holiday.List);
router.get("/getholiday", auth, Holiday.getholiday);
router.post("/holiday/approved", auth, Holiday.approved_and_rejected);

// router.get("/holidaylist", auth, Holiday.holidayList);
// router.post("/updateholiday", auth, Holiday.editHoliday);
module.exports = router;
