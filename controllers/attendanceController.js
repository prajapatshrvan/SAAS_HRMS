const Attendance = require("../models/Attendance.model.js");
const ApiCRUDController = require("../controllers/ApiCrudController.js");
const Employee = require("../models/Employee.model.js");
const AttendanceModel = require("../models/Attendance.model.js");
const Leave = require("../models/Leave.model.js");
const moment = require("moment");

const apiHandler = new ApiCRUDController(AttendanceModel);
const apiHandlerUSER = new ApiCRUDController(Employee);
const { create } = apiHandler;
const { readAllandPopulate } = apiHandlerUSER;

const checkLeaves = (attendance, leaves) => {
  return attendance.map(item => {
    let newItem = { ...item };
    delete newItem.__v;

    // Simplify date creation
    let date = new Date(item.date);
    date.setHours(0, 0, 0, 0);

    let leaveFound = false;

    for (let leave of leaves) {
      let startDate = new Date(leave.start_date);
      let endDate = new Date(leave.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (startDate <= date && endDate >= date) {
        leaveFound = true;

        if (leave.status === "approved") {
          if (leave.session === "Session 1" || leave.session === "Session 2") {
            newItem.leave_type = "HD";
            newItem.color = "FFA800";
          } else {
            newItem.leave_type = "L";
            newItem.color = "0F137E";
          }
        } else if (leave.status === "cancelled") {
          newItem.leave_type = item.status ? "P" : "A";
          newItem.color = item.status ? "30991F" : "FF0606";
        }
        break;
      }
    }

    // If no leave found, assign default values based on attendance status
    if (!leaveFound) {
      newItem.leave_type = item.status ? "P" : "A";
      newItem.color = item.status ? "30991F" : "FF0606";
    }

    return newItem;
  });
};

const removeUnnecessaryFields = data => {
  const {
    documentDob,
    originalDob,
    gender,
    email,
    inherits,
    mobile_number,
    emergency_number,
    aadharcard_no,
    resetpassword,
    aadhar_image,
    pancard_no,
    pan_image,
    sameAddress,
    company_email,
    ParmanentAddress,
    department,
    currentAddress,
    worklocation,
    bankdetails,
    ctcDetails,
    password,
    token,
    leaves,
    attendance,
    ...filteredData
  } = data;

  return filteredData;
};

const attendance = async (req, res, next) => {
  const requestData = req.body.attendance;

  if (!requestData || requestData.length === 0) {
    return res.status(400).send("Please send valid attendance");
  }

  const currentDate = new Date();
  let startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);

  let endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);

  for (const element of requestData) {
    const leave = await Leave.findOne({
      empid: element.empid,
      status: "approved",
      start_date: { $lte: endOfDay },
      end_date: { $gte: startOfDay }
    });
    if (
      element.empid === undefined ||
      element.date === undefined ||
      element.status === undefined
    ) {
      return res.status(400).send("Please provide valid employee details");
    }

    const currentDate = new Date();

    const attendanceDate = new Date(element.date);

    if (
      currentDate.getTime() - attendanceDate.getTime() <
      7 * 24 * 60 * 60 * 1000
    ) {
      const existingAttendance = await Attendance.findOne({
        empid: element.empid,
        date: {
          $gte: new Date(
            attendanceDate.getFullYear(),
            attendanceDate.getMonth(),
            attendanceDate.getDate()
          ),
          $lt: new Date(
            attendanceDate.getFullYear(),
            attendanceDate.getMonth(),
            attendanceDate.getDate() + 1
          )
        }
      });

      if (existingAttendance) {
        try {
          await Attendance.updateOne(
            {
              empid: element.empid,
              date: {
                $gte: new Date(
                  attendanceDate.getFullYear(),
                  attendanceDate.getMonth(),
                  attendanceDate.getDate()
                ),
                $lt: new Date(
                  attendanceDate.getFullYear(),
                  attendanceDate.getMonth(),
                  attendanceDate.getDate() + 1
                )
              }
            },
            { $set: { status: element.status } }
          );
        } catch (error) {
          console.error("Error updating attendance:", error);
          return res.status(500).send("Internal Server Error");
        }
      } else {
        let data = {
          empid: element.empid,
          date: attendanceDate.toISOString(),
          status: element.status
        };
        try {
          await create(data);
        } catch (error) {
          console.error("Error creating attendance:", error);
          return res.status(500).send("Internal Server Error");
        }
      }
    } else {
      return res.status(400).send("Invalid Date");
    }
  }
  res.status(200).send("Success");
};

const attendanceReport = async (req, res, next) => {
  let leaveFilters = {
    input: "$leaves",
    as: "leave",
    cond: {
      $and: [
        {
          $or: [
            { $eq: ["$$leave.status", "approved"] },
            { $eq: ["$$leave.status", "cancelled"] }
          ]
        }
      ]
    }
  };

  let collections = [
    {
      name: "leaves",
      key: "empid",
      as: "leaves",
      local: "_id",
      filters: leaveFilters
    }
  ];

  let match = [
    { $match: { $or: [{ status: "completed" }, { status: "InNoticePeriod" }] } }
  ];

  const reportData = await readAllandPopulate(collections, undefined, match);

  let modifiedData = [];

  const { month, year } = req.query;

  const currentDate = new Date();
  let firstDateOfMonth, lastDateOfMonth;

  if (month && year) {
    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10) - 1;

    if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 0 || monthInt > 11) {
      return res.status(400).json({ error: "Invalid year or month" });
    }
    firstDateOfMonth = new Date(yearInt, monthInt, 1);
    lastDateOfMonth = new Date(yearInt, monthInt + 1, 0);
  } else {
    firstDateOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    lastDateOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
  }

  const formatDateToISOString = (date, startOfDay = true) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const time = startOfDay ? "00:00:00.000" : "23:59:59.999";
    return `${year}-${month}-${day}T${time}+00:00`;
  };

  for (let index = 0; index < reportData.length; index++) {
    const item = reportData[index];

    let attendances = await AttendanceModel.find({
      empid: item._id,
      date: {
        $gte: formatDateToISOString(firstDateOfMonth, true),
        $lte: formatDateToISOString(lastDateOfMonth, false)
      }
    });

    let newItem = removeUnnecessaryFields(item);
    if (attendances.length) {
      let data = checkLeaves(attendances, item.leaves);
      newItem.attendance = data;
    }

    modifiedData.push(newItem);
  }
  res.status(200).send(modifiedData);
};

const getStartAndEndOfWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  const endOfWeek = new Date(now);

  const today = moment().startOf("day");
  const tomorrow = moment(today).endOf("day");

  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  endOfWeek.setDate(now.getDate() + (6 - dayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

const attendanceWeekReport = async (req, res, next) => {
  try {
    let leaveFilters = {
      input: "$leaves",
      as: "leave",
      cond: {
        $and: [
          {
            $or: [
              { $eq: ["$$leave.status", "approved"] },
              { $eq: ["$$leave.status", "cancelled"] }
            ]
          }
        ]
      }
    };
    let collections = [
      {
        name: "leaves",
        key: "empid",
        as: "leaves",
        local: "_id",
        filters: leaveFilters
      }
    ];

    let match = [
      {
        $match: { $or: [{ status: "completed" }, { status: "InNoticePeriod" }] }
      }
    ];

    const reportData = await readAllandPopulate(collections, undefined, match);

    let modifiedData = [];

    const { startOfWeek, endOfWeek } = getStartAndEndOfWeek();

    for (let index = 0; index < reportData.length; index++) {
      const item = reportData[index];
      let attendances = await AttendanceModel.find({
        empid: item._id,
        date: {
          $gte: startOfWeek,
          $lte: endOfWeek
        }
      });

      let newItem = removeUnnecessaryFields(item);

      if (attendances.length) {
        let data = checkLeaves(attendances, item.leaves);
        newItem.attendance = data;
      } else {
        newItem.attendance = [];
      }
      modifiedData.push(newItem);

      // console.log(modifiedData);
    }

    res.status(200).send(modifiedData);
  } catch (error) {
    next(error);
  }
};

const getStartAndEndOfDay = dateStr => {
  const inputDate = new Date(dateStr);
  const startOfDay = new Date(inputDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(inputDate);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

const todayAttendanceData = async (req, res, next) => {
  try {
    let leaveFilters = {
      input: "$leaves",
      as: "leave",
      cond: {
        $and: [
          {
            $or: [
              { $eq: ["$$leave.status", "approved"] },
              { $eq: ["$$leave.status", "cancelled"] }
            ]
          }
        ]
      }
    };
    let collections = [
      {
        name: "leaves",
        key: "empid",
        as: "leaves",
        local: "_id",
        filters: leaveFilters
      }
    ];

    let match = [
      {
        $match: { $or: [{ status: "completed" }, { status: "InNoticePeriod" }] }
      }
    ];

    const reportData = await readAllandPopulate(collections, undefined, match);

    let modifiedData = [];
    const currentDate = new Date().toISOString();
    const { startOfDay, endOfDay } = getStartAndEndOfDay(currentDate);

    for (let index = 0; index < reportData.length; index++) {
      const item = reportData[index];
      let attendances = await AttendanceModel.find({
        empid: item._id,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      let newItem = removeUnnecessaryFields(item);

      if (attendances.length) {
        let data = checkLeaves(attendances, item.leaves);
        newItem.attendance = data;
      } else {
        newItem.attendance = [];
      }
      modifiedData.push(newItem);
    }
    res.status(200).send(modifiedData);
  } catch (error) {
    next(error);
  }
};

const TotalEmployee = async (req, res, next) => {
  try {
    let leaveFilters = {
      input: "$leaves",
      as: "leave",
      cond: {
        $and: [
          {
            $or: [
              { $eq: ["$$leave.status", "approved"] },
              { $eq: ["$$leave.status", "cancelled"] }
            ]
          }
        ]
      }
    };
    let collections = [
      {
        name: "leaves",
        key: "empid",
        as: "leaves",
        local: "_id",
        filters: leaveFilters
      }
    ];

    let match = [
      {
        $match: { $or: [{ status: "completed" }, { status: "InNoticePeriod" }] }
      }
    ];

    const reportData = await readAllandPopulate(collections, undefined, match);

    let modifiedData = [];
    const currentDate = new Date().toISOString();
    const { startOfDay, endOfDay } = getStartAndEndOfDay(currentDate);

    for (let index = 0; index < reportData.length; index++) {
      const item = reportData[index];
      let attendances = await AttendanceModel.find({
        empid: item._id,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      let newItem = removeUnnecessaryFields(item);

      if (attendances.length) {
        let data = checkLeaves(attendances, item.leaves);
        newItem.attendance = data;
      } else {
        newItem.attendance = [];
      }
      modifiedData.push(newItem);
    }

    const TotalEmployees = modifiedData.length;
    let Present = modifiedData.reduce((count, element) => {
      return (
        count +
        element.attendance.filter(record => record.leave_type === "P").length
      );
    }, 0);

    let Absent = modifiedData.reduce((count, element) => {
      return (
        count +
        element.attendance.filter(record => record.leave_type === "A").length
      );
    }, 0);

    let OnLeave = modifiedData.reduce((count, element) => {
      return (
        count +
        element.attendance.filter(record => record.leave_type === "L").length
      );
    }, 0);

    let HalfDay = modifiedData.reduce((count, element) => {
      return (
        count +
        element.attendance.filter(record => record.leave_type === "H").length
      );
    }, 0);

    res.status(200).json({
      totalEmployeeCount: TotalEmployees,
      TotalEmployeePresent: Present,
      TotalEmployeeAbsent: Absent,
      totalEmployeeLeaveToday: OnLeave,
      TotalEmployeeHalfDay: HalfDay
    });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const updateby = req.user.userObjectId;
    const { empid, date, status } = req.body;

    if (!empid || !date || !updateby || status === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const startOfDay = new Date(dateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const attendanceRecord = await Attendance.findOne({
      empid: empid,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!attendanceRecord) {
      const attendance = await Attendance.create({
        empid: empid,
        date: date,
        status: status
      });
      return res.status(200).json({ message: "Attendance success" });
    }

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    if (dateObj < startOfMonth || dateObj > currentDate) {
      return res.status(403).json({
        message: "Cannot update attendance record outside of the current month"
      });
    }

    attendanceRecord.updateby = updateby;
    attendanceRecord.status = status;

    const updatedAttendance = await attendanceRecord.save();

    res.status(200).json(updatedAttendance);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  attendance,
  attendanceReport,
  todayAttendanceData,
  attendanceWeekReport,
  updateAttendance,
  TotalEmployee
};
