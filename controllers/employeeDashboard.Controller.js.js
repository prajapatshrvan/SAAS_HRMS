const Workingtime = require("../models/checincheckout.model.js");
const cron = require("node-cron");
const Employee = require("../models/Employee.model");
const moment = require("moment");
const Salary = require("../models/salaryModel.js");

module.exports.personalInfo = async (req, res) => {
  try {
    const empId = req.user?.userObjectId;
    const info = await Employee.findOne({ _id: empId });
    const First = info.firstname;
    const Middle = info.middlename;
    const Last = info.lastname;
    const fullName = `${First} ${Middle} ${Last}`;

    return res.status(200).json({
      FullName: fullName,
      Designation: info.designation,
      EmployeeID: info.employeeID,
      JoiningDate: info.createdAt,
      Department: info.department
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.getWorkingHours = async (req, res) => {
  try {
    const empId = req.user?.userObjectId;
    const workingHours = await Workingtime.findOne({ empId: empId });

    if (!workingHours) {
      return res.status(404).json({
        message: "Working hours not found for the employee"
      });
    }
    const checkInTime = new Date(workingHours.checkInTime);
    const checkOutTime = new Date(workingHours.checkOutTime);
    const durationMs = checkOutTime - checkInTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    const formattedDuration = `${hours}:${minutes}:${seconds}`;

    return res.status(200).json({
      workingHours: formattedDuration
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.EmpCurrectMonthsData = async (req, res) => {
  try {
    const empId = req.user?.userObjectId;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const workingHours = await Workingtime.find({
      empId: empId,
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    }).populate({ path: "empId", select: "firstname lastname employeeID" });

    if (!workingHours || workingHours.length === 0) {
      return res.status(404).json({
        message: "Working hours not found for the employee for the current month"
      });
    }

    const checkOutTime = new Date(workingHours.checkOutTime);
    const durationMs = checkOutTime - checkInTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    const formattedDuration = `${hours}:${minutes}:${seconds}`;

    const newData = {
      _id: workingHours._id,
      EmpId: workingHours.empId._id,
      employeeID: workingHours.empId.employeeID,
      firstname: workingHours.empId.firstname,
      lastname: workingHours.empId.lastname,
      date: workingHours.date,
      checkInTime: workingHours.checkInTime,
      checkOutTime: workingHours.checkOutTime,
      totalhours: formattedDuration
    };

    return res.status(200).json({ newData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.workingHoursList = async (req, res) => {
  try {
    const workinghoursList = await Workingtime.find().populate({
      path: "empid",
      select: "firstname lastname employeeID"
    });

    const formattedList = workinghoursList.map((item) => {
      const checkInTime = new Date(item.checkInTime);
      const checkOutTime = new Date(item.checkOutTime);
      const durationMs = checkOutTime - checkInTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
      const formattedWorkingHours = `${hours}:${formattedMinutes}:${formattedSeconds}`;
      return {
        employeeID: item.empid.employeeID,
        firstname: item.empid.firstname,
        lastname: item.empid.lastname,
        date: item.date,
        workingHours: formattedWorkingHours
      };
    });

    return res.status(200).json({
      workinghoursList: formattedList
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.empdata = async (req, res) => {
  try {
    const empId = req.user.userObjectId;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const empdata = await Workingtime.find({
      empid: empId,
      date: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }
    });

    return res.status(200).json({
      empdata: empdata
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.checkInAndCheckOut = async (req, res) => {
  try {
    const empId = req.user?.userObjectId;
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const currentTime = new Date();

    let existingDoc = await Workingtime.findOne({
      empid: empId,
      date: { $gte: todayStart }
    });

    let message, status;
    let breakHours = 0,
      breakMinutes = 0,
      breakSeconds = 0,
      overtimeMinutes = 0;

    if (existingDoc) {
      if (!existingDoc.checkOutTime) {
        existingDoc.checkOutTime = currentTime;
        const checkInTime = moment(existingDoc.checkInTime);
        const checkOutTime = moment(currentTime);
        const duration = moment.duration(checkOutTime.diff(checkInTime));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        existingDoc.hours += hours;
        existingDoc.minutes += minutes;
        existingDoc.seconds += seconds;

        let totalSeconds = existingDoc.seconds + existingDoc.minutes * 60 + existingDoc.hours * 3600;
        existingDoc.hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        existingDoc.minutes = Math.floor(totalSeconds / 60);
        existingDoc.seconds = totalSeconds % 60;

        const totalMinutes = existingDoc.hours * 60 + existingDoc.minutes;
        overtimeMinutes = totalMinutes > 450 ? totalMinutes - 450 : 0;
        existingDoc.overtimeMinutes = overtimeMinutes;

        await existingDoc.save();
        message = "Checked out successfully.";
        status = "checkedOut";
      } else {
        const lastCheckOutTime = moment(existingDoc.checkOutTime);
        const currentCheckInTime = moment(currentTime);
        if (lastCheckOutTime.isSame(currentCheckInTime, "day")) {
          const breakDuration = moment.duration(currentCheckInTime.diff(lastCheckOutTime));
          breakHours = Math.floor(breakDuration.asHours());
          breakMinutes = breakDuration.minutes();
          breakSeconds = breakDuration.seconds();
          existingDoc.breakHours += breakHours;
          existingDoc.breakMinutes += breakMinutes;
          existingDoc.breakSeconds += breakSeconds;
          let totalBreakSeconds =
            existingDoc.breakSeconds + existingDoc.breakMinutes * 60 + existingDoc.breakHours * 3600;
          existingDoc.breakHours = Math.floor(totalBreakSeconds / 3600);
          totalBreakSeconds %= 3600;
          existingDoc.breakMinutes = Math.floor(totalBreakSeconds / 60);
          existingDoc.breakSeconds = totalBreakSeconds % 60;
        }
        existingDoc.checkInTime = currentTime;
        existingDoc.checkOutTime = null;

        await existingDoc.save();
        message = "Checked in successfully.";
        status = "checkedIn";
      }
    } else {
      const newWorkingtime = new Workingtime({
        empid: empId,
        checkInTime: currentTime,
        date: todayStart,
        breakHours: breakHours,
        breakMinutes: breakMinutes,
        breakSeconds: breakSeconds,
        hours: 0,
        minutes: 0,
        seconds: 0,
        overtimeMinutes: 0
      });
      existingDoc = await newWorkingtime.save();

      message = "Checked in successfully.";
      status = "checkedIn";
    }

    const totalBreakSeconds = existingDoc.breakHours * 3600 + existingDoc.breakMinutes * 60 + existingDoc.breakSeconds;
    const totalBreakMinutes = existingDoc.breakHours * 60 + existingDoc.breakMinutes;

    const totalWorkedMinutes = existingDoc.hours * 60 + existingDoc.minutes;
    const remainingMinutes = 540 - (totalWorkedMinutes + totalBreakMinutes);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;
    const remainingSecs = 0;

    let overtimeHours = Math.floor(existingDoc.overtimeMinutes / 60);
    let overtimeMins = existingDoc.overtimeMinutes % 60;
    let overtimeSecs = 0;

    return res.status(200).json({
      message: message,
      status: status,
      overtime: {
        hours: overtimeHours,
        minutes: overtimeMins,
        seconds: overtimeSecs
      },
      remainingTime: {
        hours: remainingHours,
        minutes: remainingMins,
        seconds: remainingSecs
      },
      breakTime: {
        hours: existingDoc.breakHours,
        minutes: existingDoc.breakMinutes,
        seconds: existingDoc.breakSeconds,
        totalSeconds: totalBreakSeconds
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.salarydetails = async (req, res) => {
  try {
    const empID = req.user.userObjectId;

    if (!empID) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;

    if (previousMonth < 0) {
      previousMonth = 11;
      previousYear = currentYear - 1;
    }

    const formattedMonth = (previousMonth + 1).toString().padStart(2, "0");

    const formattedYear = previousYear.toString();

    const salaryDetails = await Salary.findOne({
      empid: empID,
      month: formattedMonth,
      year: formattedYear
    });

    if (!salaryDetails) {
      return res.status(404).json({
        message: "Salary details for the last month not found"
      });
    }

    return res.status(200).json({
      salaryDetails
    });
  } catch (error) {
    console.error("Error fetching salary details:", error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
