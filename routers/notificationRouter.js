const notificationController = require("../controllers/notificationController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post(
  "/broadcast",
  auth,
  notificationController.createBroadcastNotification
);
router.post(
  "/personal",
  auth,
  notificationController.createPersonalNotification
);
router.put(
  "/update/:notificationId",
  auth,
  notificationController.updateNotificationStatus
);

module.exports = router;
