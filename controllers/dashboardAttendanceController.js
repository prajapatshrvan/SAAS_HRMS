const Employee = require("../models/Employee.model");
const Leave = require("../models/Leave.model");
const Attendance = require("../models/Attendance.model");

const Holiday = require("../models/Holiday.model");
const Workingtime = require("../models/checincheckout.model.js");
const moment = require("moment");

module.exports.HolidayList = async (req, res) => {
  try {
    const { year, country, state } = req.query;
    const currentYear = moment().format("YYYY");
    const defaultYear = year || currentYear;
    const defaultCountry = country || "India";
    const defaultState = state || "Rajasthan";

    const query = {
      country: defaultCountry,
      state: defaultState,
      year: defaultYear,
      holiday_status: "approved"
    };

    const holidaylist = await Holiday.find(query, { country: 0, year: 0, state: 0, holiday_status: 0 });

    const formattedHolidaylist = {};
    holidaylist.forEach((holiday) => {
      const dayOfday = moment(holiday.date).format("DD");
      const dayOfMonth = moment(holiday.date).format("MM");

      if (!formattedHolidaylist[dayOfMonth]) {
        formattedHolidaylist[dayOfMonth] = [];
      }

      formattedHolidaylist[dayOfMonth].push({
        holiday_name: holiday.holiday_name,
        date: dayOfday,
        day: holiday.day
      });
    });

    return res.status(200).json({
      holidaylist: [formattedHolidaylist]
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.monthlyApprovedLeave = async (req, res) => {
  try {
    const currentYear = moment().format("YYYY");
    const currentMonth = moment().format("MM");
    const defaultYear = currentYear;
    const defaultMonth = currentMonth;

    const startDate = moment(`${defaultYear}-${defaultMonth}-01`).startOf("month");
    const endDate = moment(startDate).endOf("month");

    const leave = await Leave.find({
      status: "approved",
      start_date: { $gte: startDate, $lte: endDate }
    }).populate({ path: "empid", select: "firstname lastname employeeID" });

    const monthlyLeave = [];
    for (let index = 0; index < leave.length; index++) {
      const element = { ...leave[index]?._doc };
      if (element.empid) {
        element.employee_name = element.empid.firstname + " " + element.empid.lastname;
        element.employeeID = element.empid.employeeID;
      }
      delete element.empid;
      monthlyLeave.push(element);
    }
    return res.status(200).json({
      MonthlyLeave: monthlyLeave
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.list = async (req, res) => {
  try {
    let { month, year } = req.query;
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    month = month ? parseInt(month) - 1 : currentMonth;
    year = year ? parseInt(year) : currentYear;

    let firstDateOfMonth = new Date(year, month, 1);
    let lastDateOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const list = await Workingtime.find({
      date: {
        $gte: firstDateOfMonth,
        $lte: lastDateOfMonth
      }
    }).populate({
      path: "empid",
      select: "firstname middlename lastname employeeID department"
    });

    const modifiedList = list
      .filter((item) => item.empid) // Filter out items where empid is null
      .map((item) => {
        const fullname = [item.empid.firstname, item.empid.middlename, item.empid.lastname].filter(Boolean).join(" ");
        return {
          _id: item._id,
          employeeID: item.empid.employeeID,
          fullname,
          Department: item.empid.department,
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          date: item.date,
          hours: item.hours,
          minutes: item.minutes,
          seconds: item.seconds
        };
      });

    return res.status(200).json({
      List: modifiedList
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.monthlyLeave = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    const leaveData = await Leave.aggregate([
      {
        $match: {
          $or: [
            { start_date: { $gte: startOfMonth, $lt: endOfMonth } },
            { end_date: { $gte: startOfMonth, $lt: endOfMonth } }
          ]
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    leaveData.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    return res.status(200).json({
      status: ["pending", "approved", "rejected"],
      series: [statusCounts.pending, statusCounts.approved, statusCounts.rejected]
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.yearlydata = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfToday = new Date(currentYear, currentMonth, currentDate.getDate(), 23, 59, 59);

    const attendanceData = await Attendance.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfToday
      }
    });

    const groupedData = attendanceData.reduce((acc, record) => {
      const recordDate = new Date(record.date);
      const dateKey = `${recordDate.getFullYear()}-${recordDate.getMonth() + 1}-${recordDate.getDate()}`;

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, present: 0, absent: 0, total: 0 };
      }

      if (record.status === true) {
        acc[dateKey].present += 1;
      } else {
        acc[dateKey].absent += 1;
      }

      acc[dateKey].total = acc[dateKey].present + acc[dateKey].absent;

      return acc;
    }, {});

    const resultArray = Object.values(groupedData);

    return res.status(200).json(resultArray);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
