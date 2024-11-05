const Notification = require("../controllers/notificationController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/addnotification", auth, Notification.AddNotification);
router.post("/updatenotification/:id", auth, Notification.UpdateNotification);
router.get("/getnotification", auth, Notification.GetNotification);

module.exports = router;
