const Notication = require("../models/NotificationModel");

module.exports.AddNotification = async (req, res) => {
  try {
    const { notification, date } = req.body;

    if (!notification || !notification.trim()) {
      return res.status(400).json({ message: "Please enter Notification Message" });
    }

    const notifications = new Notication({
      notification,
      date,
    });

    await notifications.save();

    return res.status(200).json({
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports.UpdateNotification = async (req, res) => {
  try {
    const { notification, date } = req.body;
    const id = req.params.id;

    if (!notification || !notification.trim()) {
      return res.status(400).json({ message: "Please enter Notification Message" });
    }

    const notificationToUpdate = await Notication.findOne({ _id: id });

    if (!notificationToUpdate) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Notication.findByIdAndUpdate(id, {
      $set: {
        notification,
        date,
      },
    });

    res.status(200).json({
      message: "Notification updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports.GetNotification = async (req, res) => {
  try {
    const notifications = await Notication.find();
    res.status(200).json({
      Notifications: notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
