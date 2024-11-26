const Holiday = require("../controllers/holidayController");
const { auth, checkAccess } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post(
  "/addbulkholiday",
  auth,
  checkAccess("holidays", "create"),
  Holiday.addBulkHoliday
);

router.post(
  "/update/holiday",
  auth,
  checkAccess("holidays", "edit"),
  Holiday.UpdateHoliday
);

router.post(
  "/holiday/status",
  auth,
  checkAccess("holidays", "edit"),
  Holiday.HolidayStatus
);

router.post(
  "/deleteholiday",
  auth,
  checkAccess("holidays", "delete"),
  Holiday.deleteHoliday
);

router.get(
  "/holiday/list",
  auth,
  checkAccess("holidays", "view"),
  Holiday.List
);

router.get(
  "/getholiday",
  auth,
  checkAccess("holidays", "view"),
  Holiday.getholiday
);

router.post(
  "/holiday/approved",
  auth,
  checkAccess("holidays", "edit"),
  Holiday.approved_and_rejected
);

// router.get("/holidaylist", auth, Holiday.holidayList);
// router.post("/updateholiday", auth, Holiday.editHoliday);
module.exports = router;
