const Notification = require("../models/NotificationModel");
const { io } = require("../server");

exports.createBroadcastNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    const notification = new Notification({
      empid: null,
      title,
      message
    });
    await notification.save();

    if (io) {
      io.emit("broadcastNotification", {
        id: notification._id,
        title,
        message,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      });
    } else {
      console.error("Socket.io instance is undefined");
    }

    return res.status(200).json({
      success: true,
      message: "Broadcast notification sent successfully"
    });
  } catch (error) {
    console.error("Error creating broadcast notification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.createPersonalNotification = async (req, res) => {
  try {
    const { empid, title, message } = req.body;
    const notification = new Notification({
      empid,
      title,
      message
    });
    await notification.save();

    if (io) {
      io.to(empid).emit("personalNotification", {
        id: notification._id,
        title,
        message,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      });
    } else {
      console.error("Socket.io instance is undefined");
    }

    return res.status(200).json({
      success: true,
      message: "Personal notification sent successfully"
    });
  } catch (error) {
    console.error("Error creating personal notification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.updateNotificationStatus = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification
    });
  } catch (error) {
    console.error("Error updating notification status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
