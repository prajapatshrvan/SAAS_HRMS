const Workingtime = require("../models/checincheckout.model.js");
const cron = require("node-cron");
const Employee = require("../models/Employee.model");
const moment = require("moment");
const Salary = require("../models/salaryModel.js");

module.exports.personalInfo = async (req, res) => {
  try {
    const empId = req.user?.userObjectId;
    const info = await Employee.findOne({ _id: empId },{password : 0,token : 0,inherits : 0,__v : 0});
    const First = info.firstname;
    const Middle = info.middlename;
    const Last = info.lastname;
    const fullName = `${First} ${Middle} ${Last}`;
    

    return res.status(200).json({
      FullName: fullName,
      Designation: info.designation,
      EmployeeID: info.employeeID,
      JoiningDate: info.createdAt,
      Department: info.department,
      info
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
  
    const todayStart = new Date().toISOString().slice(0, 10)

    const currentTime = new Date();

    let workingTime = await Workingtime.findOne({
      empid: empId,
      date: todayStart ,
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
    // if (workingTime.check.length >= 4) {
    //   return res.status(400).json({
    //     message: "Maximum 4 check-in/check-out pairs are allowed per day.",
    //   });
    // }

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

    const startOfDay = new Date(date).toISOString().slice(0, 10);
    let workingTime = await Workingtime.findOne({
      empid: empid,
      date: startOfDay,
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
    const  empid  = req.user.userObjectId;
    
    if (!empid ) {
      return res.status(400).json({
        message: "Employee ID and date are required.",
      });
    }
    const currentTime = new Date();
    const startOfDay = new Date().toISOString().slice(0, 10);

    let workingTime = await Workingtime.findOne({
      empid: empid,
      date: startOfDay,
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

      const breakDuration = moment
        .duration(moment(ongoingBreak.breakEnd).diff(moment(ongoingBreak.breakStart)))
        .asMinutes();

      await workingTime.save();

      return res.status(200).json({
        message: "Break ended successfully.",
        status:"Break end",
        breakDuration: `${breakDuration}`,
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
      status:"Break start",
      workingTime,
    });
  } catch (error) {
    console.error("Error in manageBreak:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.workingHoursList = async (req, res) => {
  try {
    // const { date } = req.query; 
    const userRole = req.user?.role_name; 
    const currentUserId = req.user?.userObjectId; 
    
    const query = {};

    // if (date) {
    //   const dayStart = new Date(new Date(date).setHours(0, 0, 0, 0));
    //   const dayEnd = new Date(new Date(date).setHours(23, 59, 59, 999));
    //   query.date = { $gte: dayStart, $lte: dayEnd };
    // } else {
    //   // Default to today's date
    //   const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
    //   query.date = { $gte: todayStart };
    // }
  
    if (userRole != "ADMIN" && userRole != "HR") {
      query.empid = currentUserId; 
    }
  
    const workingTimeData = await Workingtime.find(query).populate({
      path: "empid",
      select: "firstname lastname employeeID",
    });

    // Handle no data found
    if (!workingTimeData || workingTimeData.length === 0) {
      return res.status(404).json({
        message: "No working time data found for the given criteria.",
      });
    }

    // Format the response data
    const formattedData = workingTimeData.map((item) => {
      const checkDetails = item.check.map((check) => ({
        checkIn: check.checkin ? new Date(check.checkin).toISOString() : null,
        checkOut: check.checkout ? new Date(check.checkout).toISOString() : null,
      }));

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

    // Send response with formatted data
    return res.status(200).json({
      message: "Working time data retrieved successfully.",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in workingHoursList:", error);
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
      data: birthday,
      message:"birthady found"
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

    const birthdays = await Employee.aggregate([
      {
        $match: {
          status: "completed",
          $expr: {
            $and: [
              {
                $eq: [
                  { $month: { $dateFromString: { dateString: "$originalDob" } } },
                  currentMonth
                ]
              }, 
              {
                $gt: [
                  { $dayOfMonth: { $dateFromString: { dateString: "$originalDob" } } },
                  currentDay
                ]
              } 
            ]
          }
        }
      },
      {
        $set: {
          dayOfMonth: { $dayOfMonth: { $dateFromString: { dateString: "$originalDob" } } }
        }
      },
      {
        $sort: { dayOfMonth: 1 } 
      },
      {
        $project: {
          firstname: 1,
          lastname: 1,
          middlename: 1,
          image: 1,
          originalDob: 1,
          profile: 1
        }
      }
    ]);
   
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

module.exports.Work_Anniversary = async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    const work_anniversaries = await Employee.aggregate([
      {
        $match: {
          status: "completed",
          $expr: {
            $and: [
              { $eq: [{ $month: "$joining_date" }, month] },
              { $eq: [{ $dayOfMonth: "$joining_date" }, day] }
            ]
          }
        }
      },
      {
        $sort: { joining_date: 1 } 
      },
      {
        $project: {
          firstname: 1,
          lastname: 1,
          joining_date: 1,
          createdAt: 1
        }
      }
    ]);


    return res.status(200).json({
      success: true,
      data: work_anniversaries
    });
  } catch (error) {
    console.error("Error fetching work anniversaries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports.Week_Working_Hours_List = async (req, res) => {
  try {
    const currentUserId = req.user?.userObjectId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const inputDate = new Date();
    const dayOfWeek = inputDate.getDay();

    const sunday = new Date(inputDate.setDate(inputDate.getDate() - dayOfWeek));
    const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);

    const weekStart = sunday.toISOString().slice(0, 10);
    const weekEnd = saturday.toISOString().slice(0, 10);

    
    const query = {
      empid: currentUserId,
      date: { $gte: weekStart, $lte: weekEnd },
    };

    const workingTimeData = await Workingtime.find(query, "overtime breaktime worktime date");

    const weekDates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(sunday.getTime() + i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      weekDates.push(date);
    }

    const formattedData = weekDates.map(date => {
      const dayData = workingTimeData.find(entry => entry.date === date);

      // Default values for days with no data
      if (!dayData) {
        return {
          date: date,
          overtime: "0 hours",
          breaktime: "0 hours",
          worktime: "0 hours",
      
        };
      }

      // Return actual data if available
      const { overtime, breaktime, worktime, check } = dayData.toObject();
      return {
        date,
        overtime,
        breaktime,
        worktime,
        check,
      };
    });

    return res.status(200).json({
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in Week_Working_Hours_List:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.workingHoursCountList = async (req, res) => {
  try {
    const empid = req.user?.userObjectId;

    // Query for current month working time data
    const currentMonth = moment().month() + 1;
    const monthQuery = {
      empid: empid,
      $expr: {
        $eq: [{ $month: { $dateFromString: { dateString: "$date" } } }, currentMonth],
      },
    };

    const [workingTimeData, weekData] = await Promise.all([
      Workingtime.find(monthQuery),
      (() => {
        // Calculate start and end of the current week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekQuery = {
          empid: empid,
          date: {
            $gte: startOfWeek,
            $lte: endOfWeek,
          },
        };

        return Workingtime.find(weekQuery);
      })(),
    ]);

    // Calculate totals for the current week
    const totalWeekHours = weekData.reduce((total, entry) => total + (entry.worktime || 0), 0);

    // Calculate totals for the current month
    const totals = workingTimeData.reduce(
      (acc, entry) => {
        acc.totalWorkingHours += entry.worktime || 0;
        acc.totalOvertime += entry.overtime || 0;
        acc.totalBreakTime += entry.breaktime || 0;
        return acc;
      },
      { totalWorkingHours: 0, totalOvertime: 0, totalBreakTime: 0 }
    );

    // Format the response data
    const formattedData = {
      totalWeekHours,
      ...totals,
    };

    // Respond with success
    return res.status(200).json({
      message: "Working time data retrieved successfully.",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in workingHoursCountList:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};














