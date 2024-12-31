const Offboarding = require("../models/offboardingModel");
const Employee = require("../models/Employee.model");
const { populate } = require("../models/advanceSalary.model");
const Attendance = require("../models/Attendance.model");
const { response } = require("express");

module.exports.createOffboarding = async (req, res) => {
  try {
    const {
      resignation_type,
      notice_date,
      resignation_date,
      reason
    } = req.body;
    const cooling_period = 30;
    const empid = req.user.userObjectId;

    if (!reason.trim()) {
      return res.status(400).json({ message: "Please enter valid reason" });
    }

    const Offboardingexist = await Offboarding.findOne({
      empid,
      offboarding_status: { $in: ["completed", "approved", "pending"] }
    });
    if (Offboardingexist) {
      return res.status(409).json({
        message: "You are already resigned"
      });
    }

    const offboarding = new Offboarding({
      empid,
      employeeID: employee.employeeID,
      employeeName: `${employee.firstname} ${employee.middlename} ${employee.lastname}`,
      resignation_type,
      notice_date,
      resignation_date,
      reason,
      cooling_period
    });

    await offboarding.save();

    return res.status(200).json({
      message: "Offboarding application submitted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports.Status = async (req, res) => {
  try {
    const { id, status } = req.body;
    let statuses = [
      "approved",
      "rejected",
      "cancelled",
      "InNoticePeriod",
      "completed"
    ];

    const data = await Offboarding.findById(id);
    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    const employee = await Employee.findById(data.empid);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (statuses.includes(status)) {
      await Offboarding.findByIdAndUpdate(data._id, {
        $set: { offboarding_status: status }
      });

      if (status === "cancelled") {
        employee.status = "completed";
        await employee.save();
      } else if (status == "approved") {
        employee.status = "InNoticePeriod";
        await employee.save();
      }

      return res.status(200).json({
        message: `Offboarding status updated to ${status}`
      });
    } else {
      return res.status(400).json({
        message: "Invalid status. Please enter a valid status."
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.offBoardingList = async (req, res) => {
  const { offboarding_status } = req.query;
  try {
    let offboarding;
    if (offboarding_status) {
      offboarding = await Offboarding.find({
        offboarding_status: offboarding_status
      }).populate({
        path: "empid",
        select:
          "employeeID firstname middlename lastname image email mobile_number"
      });
    } else {
      offboarding = await Offboarding.find().sort({ createdAt: -1 });
    }
    const modifiedOffboardingList = offboarding.map(item => {
      const newItem = { ...item._doc };
      if (newItem.empid) {
        newItem.employee_name = `${newItem.empid.firstname} ${newItem.empid
          .lastname}`;
        newItem.employeeID = newItem.empid.employeeID;
        newItem.image = newItem.empid.image;
        newItem.email = newItem.empid.email;
        newItem.mobile_number = newItem.empid.mobile_number;
      }
      delete newItem.empid;
      return newItem;
    });

    return res.status(200).json({
      List: modifiedOffboardingList
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.offboardingView = async (req, res) => {
  try {
    const { id } = req.body;
    const viewOffboarding = await Offboarding.findOne({ _id: id }).populate({
      path: "empid",
      select:
        "firstname middlename lastname employeeID company_email department designation"
    });
    return res.status(200).json({
      viewOffboarding: viewOffboarding
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.offboardingDelete = async (req, res) => {
  try {
    const { id } = req.body;
    const deleteoffboarding = await Offboarding.findByIdAndDelete({ _id: id });
    return res.status(200).json({
      message: "Delete Sucessfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
