const Notication = require("../models/NotificationModel");

module.exports.AddNotification = async (req, res) => {
  try {
    const { empid, title, message } = req.body;

    if (!empid) {
      return res.status(400).json({ mesage: "empid is required" });
    } else if (!title) {
      return res.status(400).json({ mesage: "title is required" });
    } else if (!message) {
      return res.status(400).json({ mesage: "message is required" });
    }

    const notifications = new Notication({
      empid,
      title,
      message
    });

    await notifications.save();

    return res.status(200).json({
      message: "Notification sent successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.UpdateNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const id = req.params.id;

    if (!title) {
      return res.status(400).json({ mesage: "title is required" });
    } else if (!message) {
      return res.status(400).json({ mesage: "message is required" });
    }

    const notificationToUpdate = await Notication.findOne({ _id: id });

    if (!notificationToUpdate) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Notication.findByIdAndUpdate(id, {
      $set: {
        title,
        message
      }
    });

    res.status(200).json({
      message: "Notification updated successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.GetNotification = async (req, res) => {
  try {
    const notifications = await Notication.find();
    res.status(200).json({
      Notifications: notifications
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
