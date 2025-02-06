const mongoose = require("mongoose");
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");
const Leave = require("../models/Leave.model");
const Asset = require("../models/Asset.model");
const moment = require("moment");

module.exports.Empdata = async (req, res) => {
  try {
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    // console.log(startOfMonth, " startOfMonth");
    // console.log(endOfMonth, " endOfMonth");

    const empCount = await Employee.find({
      status: { $in: ["completed", "InNoticePeriod"] }
    });

    const newOnboarding = await Employee.countDocuments({
      status: "completed",
      joining_date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const offboarding = await Employee.countDocuments({
      status: "InNoticePeriod",
      updatedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    res.status(200).json({
      totalEmployeeCount: empCount.length,
      totalnewOnboarding: newOnboarding,
      totaloffOnboarding: offboarding
      // probationPeriod: probationPeriod
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports.OnboardingStatus = async (req, res) => {
  try {
    const empCompleted = await Employee.countDocuments({ status: "completed" });
    const empinprocess = await Employee.countDocuments({ status: "approved" });
    const emppending = await Employee.countDocuments({ status: "pending" });

    return res.status(200).json({
      Completed: empCompleted,
      InProcess: empinprocess,
      Pending: emppending
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.empAttendaceStaus = async (req, res) => {
  try {
    const currentDate = moment().format("YYYY-MM-DD");
    const totalpresent = await Attendance.countDocuments({
      status: true,
      date: { $gte: currentDate, $lt: moment(currentDate).add(1, "days") }
    });

    const totalabsent = await Attendance.countDocuments({
      status: false,
      date: { $gte: currentDate, $lt: moment(currentDate).add(1, "days") }
    });

    const totalLeaveToday = await Leave.countDocuments({
      status: "approved",
      $or: [
        { start_date: { $lte: currentDate }, end_date: { $gte: currentDate } },
        { start_date: currentDate, end_date: currentDate }
      ]
    });

    return res.status(200).json({
      Present: totalpresent,
      Absent: totalabsent,
      OnLeave: totalLeaveToday
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.allAssetStatus = async (req, res) => {
  try {
    const invertoryCount = await Asset.countDocuments({ status: "unassigned" });
    const assetAssignedCount = await Asset.countDocuments({
      status: "unassigned"
    });
    const assetrepairCount = await Asset.countDocuments({ status: "repair" });

    return res.status(200).json({
      Inventory: invertoryCount,
      Assign: assetAssignedCount,
      Repair: assetrepairCount
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.departmentCount = async (req, res) => {
  try {
    const { year, month, week } = req.query;

    const matchFilter = { status: "completed" };
    const currentDate = new Date();

    // Filter based on year, month, week
    if (year === "365") {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 365);
      matchFilter.createdAt = { $gte: startDate, $lte: currentDate };
    }

    if (month === "30") {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 30);
      matchFilter.createdAt = { $gte: startDate, $lte: currentDate };
    }

    if (week === "7") {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7);
      matchFilter.createdAt = { $gte: startDate, $lte: currentDate };
    }

    // Aggregate department counts
    const departmentCounts = await Employee.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const allDepartments = ["IT", "ADMIN", "SALES", "ACCOUNT", "HR"];

    const departmentData = allDepartments.map(dept => {
      const found = departmentCounts.find(item => item._id === dept);
      return { department: dept, count: found ? found.count : 0 };
    });

    // Prepare the response
    const departments = departmentData.map(item => item.department);
    const series = departmentData.map(item => item.count);

    return res.status(200).json({
      success: true,
      departments,
      series
    });
  } catch (error) {
    console.error("Error fetching department counts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports.list = async (req, res) => {
  try {
    const { year, month, week } = req.query;

    const matchFilter = { status: "completed" };
    const currentDate = new Date();

    if (year === "365") {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 365);
      matchFilter.createdAt = { $gte: startDate, $lte: currentDate };
    }

    if (month === "30") {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 30);
      matchFilter.createdAt = { $gte: startDate, $lte: currentDate };
    }

    if (week === "7") {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7);
      matchFilter.createdAt = { $gte: startDate, $lte: currentDate };
    }

    const emplist = await Employee.find(
      matchFilter,
      "firstname lastname image originalDob gender email mobile_number"
    );

    return res.status(200).json({
      success: true,
      List: emplist
    });
  } catch (error) {
    console.error("Error fetching employee list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports.yearlydata = async (req, res) => {
  try {
    let { year } = req.body;

    if (!year) {
      year = new Date().getFullYear();
    }

    if (isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ message: "Invalid year provided" });
    }

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Aggregation for Onboarding
    const onboardingData = await Employee.aggregate([
      {
        $match: {
          joining_date: {
            $gte: startOfYear,
            $lte: endOfYear
          },
          status: "completed"
        }
      },
      {
        $group: {
          _id: { $month: "$joining_date" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const formattedOnboardingData = Array(12).fill(0);
    onboardingData.forEach(data => {
      formattedOnboardingData[data._id - 1] = data.count;
    });

    // Aggregation for OffBoarding
    const offboardingData = await Employee.aggregate([
      {
        $match: {
          updatedAt: {
            $gte: startOfYear,
            $lte: endOfYear
          },
          status: "InNoticePeriod"
        }
      },
      {
        $group: {
          _id: { $month: "$updatedAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const formattedOffboardingData = Array(12).fill(0);
    offboardingData.forEach(data => {
      formattedOffboardingData[data._id - 1] = data.count;
    });

    return res.status(200).json({
      year,
      series: [
        {
          name: "Onboarding",
          data: formattedOnboardingData
        },
        {
          name: "OffBoarding",
          data: formattedOffboardingData
        }
      ]
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
