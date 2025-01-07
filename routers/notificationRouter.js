const notificationController = require("../controllers/notificationController");
const router = require("express").Router();

router.post("/broadcast", notificationController.createBroadcastNotification);
router.post("/personal", notificationController.createPersonalNotification);
router.put(
  "/update/:notificationId",
  notificationController.updateNotificationStatus
);

module.exports = router;
