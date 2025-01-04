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

// module.exports.workingHoursList = async (req, res) => {
//   try {
//     const workinghoursList = await Workingtime.find().populate({
//       path: "empid",
//       select: "firstname lastname employeeID"
//     });

//     const formattedList = workinghoursList.map((item) => {
//       const checkInTime = new Date(item.checkInTime);
//       const checkOutTime = new Date(item.checkOutTime);
//       const durationMs = checkOutTime - checkInTime;
//       const hours = Math.floor(durationMs / (1000 * 60 * 60));
//       const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
//       const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
//       const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
//       const formattedWorkingHours = `${hours}:${formattedMinutes}:${formattedSeconds}`;
//       return {
//         employeeID: item.empid.employeeID,
//         firstname: item.empid.firstname,
//         lastname: item.empid.lastname,
//         date: item.date,
//         workingHours: formattedWorkingHours
//       };
//     });

//     return res.status(200).json({
//       workinghoursList: formattedList
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal Server Error"
//     });
//   }
// };

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

module.exports.checkInAndCheckOut = async (req, res) => {
  try {
    const empId = req.user?.userObjectId;
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)); 
    const currentTime = new Date();

    let workingTime = await Workingtime.findOne({
      empid: empId,
      date: { $gte: todayStart },
    });

    if (!workingTime) {
      workingTime = new Workingtime({
        empid: empId,
        date: todayStart,
        check: [{ checkin: currentTime }],
      });

      await workingTime.save();
      return res.status(200).json({
        message: "Checked in successfully.",
        status: "checkedIn",
        workingTime,
      });
    }

    if (!Array.isArray(workingTime.check)) {
      workingTime.check = [];
    }

    const latestCheck = workingTime.check[workingTime.check.length - 1];

    if (latestCheck && !latestCheck.checkout) {
      // Handle checkout
      latestCheck.checkout = currentTime;

      // Calculate working time and break time
      const totalWorkedMinutes = workingTime.check.reduce((total, item) => {
        if (item.checkin && item.checkout) {
          const duration = moment.duration(
            moment(item.checkout).diff(moment(item.checkin))
          );
          total += duration.asMinutes();
        }
        return total;
      }, 0);

      const totalBreakMinutes = workingTime.breaks?.reduce((total, breakItem) => {
        if (breakItem.breakStart && breakItem.breakEnd) {
          const duration = moment.duration(
            moment(breakItem.breakEnd).diff(moment(breakItem.breakStart))
          );
          total += duration.asMinutes();
        }
        return total;
      }, 0) || 0;

      workingTime.overtime = Math.max(0, totalWorkedMinutes - 450);
      workingTime.worktime = Math.max(0, totalWorkedMinutes - totalBreakMinutes);
      workingTime.breaktime = totalBreakMinutes;

      await workingTime.save();

      return res.status(200).json({
        message: "Checked out successfully.",
        status: "checkedOut",
        workingTime,
      });
    }

    // Ensure no more than 4 check-ins/check-outs
    if (workingTime.check.length >= 4) {
      return res.status(400).json({
        message: "Maximum 4 check-in/check-out pairs are allowed per day.",
      });
    }

    // Handle check-in
    workingTime.check.push({ checkin: currentTime });
    await workingTime.save();

    return res.status(200).json({
      message: "Checked in successfully.",
      status: "checkedIn",
      workingTime,
    });
  } catch (error) {
    console.error("Error in checkInAndCheckOut:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.updateWorkingTime = async (req, res) => {
  try {
    const { empid, date, newCheckin, newCheckout } = req.body;

    // Validate if new check-in time is provided
    if (!newCheckin) {
      return res.status(400).json({
        message: "New check-in time is required.",
      });
    }

    const startOfDay = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
    let workingTime = await Workingtime.findOne({
      empid: empid,
      date: { $gte: startOfDay },
    });

    if (!workingTime) {
      workingTime = new Workingtime({
        empid: empid,
        date: startOfDay,
        check: [], 
      });
    }

    workingTime.check = [
      {
        checkin: new Date(newCheckin),
        checkout: newCheckout ? new Date(newCheckout) : null,
      },
    ];


    let totalWorkedMinutes = 0;
    if (newCheckout) {
      const checkinTime = moment(newCheckin);
      const checkoutTime = moment(newCheckout);
      const duration = moment.duration(checkoutTime.diff(checkinTime));
      totalWorkedMinutes = duration.asMinutes();
    }

    workingTime.overtime = Math.max(0, totalWorkedMinutes - 450);

    await workingTime.save();

    return res.status(200).json({
      message: "Working time updated successfully, and previous entries removed.",
      workingTime,
    });
  } catch (error) {
    console.error("Error in updateWorkingTime:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.manageBreak = async (req, res) => {
  try {
    const { empid, date } = req.body;

    if (!empid || !date) {
      return res.status(400).json({
        message: "Employee ID and date are required.",
      });
    }

    const currentTime = new Date();
    const startOfDay = new Date(new Date(date).setUTCHours(0, 0, 0, 0));

    let workingTime = await Workingtime.findOne({
      empid: empid,
      date: { $gte: startOfDay },
    });

    if (!workingTime) {
      workingTime = new Workingtime({
        empid: empid,
        date: startOfDay,
        check: [],
        breaks: [],
      });
    }

    // Check for an ongoing break
    const ongoingBreak = workingTime.breaks.find(
      (breakItem) => !breakItem.breakEnd
    );

    if (ongoingBreak) {
      // End the ongoing break
      ongoingBreak.breakEnd = currentTime;

      // Calculate total break duration in minutes (optional)
      const breakDuration = moment
        .duration(moment(ongoingBreak.breakEnd).diff(moment(ongoingBreak.breakStart)))
        .asMinutes();

      await workingTime.save();

      return res.status(200).json({
        message: "Break ended successfully.",
        breakDuration: `${breakDuration} minutes`,
        workingTime,
      });
    }

    // Start a new break
    workingTime.breaks.push({
      breakStart: currentTime,
    });

    await workingTime.save();

    return res.status(200).json({
      message: "Break started successfully.",
      workingTime,
    });
  } catch (error) {
    console.error("Error in manageBreak:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.workingHoursList = async (req, res) => {
  try {
    const { empId, date } = req.query; 
    const userRole = req.user?.role; 
    const currentUserId = req.user?.userObjectId;
    const query = {};

    if (empId) {
      query.empid = empId;
    }

    if (date) {
      const dayStart = new Date(new Date(date).setHours(0, 0, 0, 0));
      const dayEnd = new Date(new Date(date).setHours(23, 59, 59, 999));
      query.date = { $gte: dayStart, $lte: dayEnd };
    } else {
      const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
      query.date = { $gte: todayStart };
    }

    if (userRole !== 'ADMIN' && userRole !== 'HR') {
      query.empid = currentUserId;
    }

    const workingTimeData = await Workingtime.find(query).populate({
      path: 'empid',
      select: 'firstname lastname employeeID',
    });

    if (!workingTimeData || workingTimeData.length === 0) {
      return res.status(404).json({
        message: "No working time data found for the given criteria.",
      });
    }

    const formattedData = workingTimeData.map((item) => {
      const checkDetails = item.check.map((check) => {
        const checkIn = check.checkin ? new Date(check.checkin).toISOString() : null;
        const checkOut = check.checkout ? new Date(check.checkout).toISOString() : null;

        return {
          checkIn,
          checkOut,
        };
      });

      return {
        employeeID: item.empid?.employeeID || "N/A",
        firstname: item.empid?.firstname || "N/A",
        lastname: item.empid?.lastname || "N/A",
        date: item.date,
        checkDetails,
        overtime: item.overtime || 0,
        worktime: item.worktime || 0,
        breaktime: item.breaktime || 0,
      };
    });

    return res.status(200).json({
      message: "Working time data retrieved successfully.",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getCheckInData:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.BirthdaysCurrentDay = async (req, res) => {
  try {
    const day = new Date().getDate();
    const month = new Date().getMonth() + 1; 
    const birthday = await Employee.find({
      status : "completed",
      $expr: {
        $and: [
          { $eq: [{ $month: { $dateFromString: { dateString: "$originalDob" } } }, month] },
          { $eq: [{ $dayOfMonth: { $dateFromString: { dateString: "$originalDob" } } }, day] }
        ]
      }
    }).select({firstname : 1, lastname : 1, middlename : 1, image : 1,originalDob :1});

    return res.status(200).json({
      data: birthday
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};



module.exports.BirthdaysCurrentMonth = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; 
    const currentDay = currentDate.getDate(); 

    const birthdays = await Employee.find({
      $expr: {
        $and: [
          { $eq: [{ $month: { $dateFromString: { dateString: "$originalDob" } } }, currentMonth] }, 
          { $gte: [{ $dayOfMonth: { $dateFromString: { dateString: "$originalDob" } } }, currentDay] } 
        ]
      }
    }).select({
      firstname: 1,
      lastname: 1,
      middlename: 1,
      image: 1,
      originalDob: 1
    });

    return res.status(200).json({
      data: birthdays,
      message: "Birthdays found from current date to month's end"
    });
  } catch (error) {
    console.error("Error fetching birthdays:", error.message);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};









