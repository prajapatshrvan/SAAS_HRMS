const Attendance = require("../models/Attendance.model.js");
const ApiCRUDController = require("../controllers/ApiCrudController.js");
const Employee = require("../models/Employee.model.js");
const AttendanceModel = require("../models/Attendance.model.js");
const Leave = require("../models/Leave.model.js");
const moment = require("moment");
const mongoose = require("mongoose");

const apiHandler = new ApiCRUDController(AttendanceModel);
const apiHandlerUSER = new ApiCRUDController(Employee);
const { create } = apiHandler;
const { readAllandPopulate } = apiHandlerUSER;

const checkLeaves = (attendance, leaves) => {
  return attendance.map(item => {
    let newItem = { ...item };
    delete newItem.__v;

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
    family_member_first_name,
    family_member_last_name,
    relationship,
    family_member_dob,
    family_member_phone,
    family_member_email,
    __v,
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

    const attendanceData = modifiedData.map(data => {
      let newData = { ...data }; // Create a copy of the object
      // Delete unwanted properties
      delete newData["$__"];
      delete newData["$isNew"];
      delete newData["$__"];

      return newData; // Return the cleaned object
    });
    res.status(200).send(attendanceData);
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

    console.log(req.body);

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

const employeeAttendanceReport = async (req, res, next) => {
  const empid = new mongoose.Types.ObjectId(req.user.userObjectId);

  try {
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // console.log(startOfMonth, endOfMonth);

    const attendanceReport = await Attendance.aggregate([
      {
        $match: {
          empid: empid,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $lookup: {
          from: "leaves",
          localField: "empid",
          foreignField: "empid",
          as: "leaveDetails"
        }
      },
      {
        $addFields: {
          leaveDetails: {
            $filter: {
              input: "$leaveDetails",
              as: "leave",
              cond: {
                $and: [
                  { $lte: ["$$leave.start_date", "$date"] },
                  { $gte: ["$$leave.end_date", "$date"] },
                  { $eq: ["$$leave.status", "approved"] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gt: [{ $size: "$leaveDetails" }, 0] },
                      {
                        $or: [
                          {
                            $eq: [
                              { $arrayElemAt: ["$leaveDetails.session", 0] },
                              "Session 1"
                            ]
                          },
                          {
                            $eq: [
                              { $arrayElemAt: ["$leaveDetails.session", 0] },
                              "Session 2"
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  then: "HD"
                },
                {
                  case: {
                    $and: [
                      { $gt: [{ $size: "$leaveDetails" }, 0] },
                      {
                        $ne: [
                          { $arrayElemAt: ["$leaveDetails.session", 0] },
                          "Session 1"
                        ]
                      },
                      {
                        $ne: [
                          { $arrayElemAt: ["$leaveDetails.session", 0] },
                          "Session 2"
                        ]
                      }
                    ]
                  },
                  then: "L"
                },
                {
                  case: { $eq: ["$status", true] },
                  then: "P"
                }
              ],
              default: "A"
            }
          }
        }
      },
      {
        $addFields: {
          color: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "P"] }, then: "30991F" },
                { case: { $eq: ["$status", "A"] }, then: "FF0606" },
                { case: { $eq: ["$status", "HD"] }, then: "FFA800" },
                { case: { $eq: ["$status", "L"] }, then: "0F137E" }
              ],
              default: "000000"
            }
          }
        }
      },
      {
        $project: {
          empid: 1,
          date: 1,
          status: 1,
          leave_type: "$status",
          color: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);
    return res.send(attendanceReport);
  } catch (error) {
    next(error);
  }
};

const attendanceReportTesting = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();

    let firstDateOfMonth, lastDateOfMonth;

    // Validate and calculate the month and year range
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

    // Convert dates to ISO strings for querying
    const formatDateToISOString = (date, startOfDay = true) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const time = startOfDay ? "00:00:00.000" : "23:59:59.999";
      return new Date(`${year}-${month}-${day}T${time}Z`);
    };

    const startOfMonth = formatDateToISOString(firstDateOfMonth, true);
    const endOfMonth = formatDateToISOString(lastDateOfMonth, false);

    // MongoDB aggregation pipeline
    const pipeline = [
      {
        $match: {
          $or: [{ status: "completed" }, { status: "InNoticePeriod" }]
        }
      },
      {
        $lookup: {
          from: "leaves",
          localField: "_id",
          foreignField: "empid",
          as: "leaves"
        }
      },
      {
        $lookup: {
          from: "attendances",
          let: { empId: "$_id", leaves: "$leaves" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$empid", "$$empId"] },
                    { $gte: ["$date", startOfMonth] },
                    { $lte: ["$date", endOfMonth] }
                  ]
                }
              }
            },
            {
              $addFields: {
                leaveData: {
                  $ifNull: ["$leaveData", []]
                }
              }
            },
            {
              $addFields: {
                leaveData: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$$leaves",
                        as: "leave",
                        cond: {
                          $and: [
                            { $gte: ["$date", "$$leave.start_date"] },
                            { $lte: ["$date", "$$leave.end_date"] },
                            {
                              $in: ["$$leave.status", ["approved", "cancelled"]]
                            }
                          ]
                        }
                      }
                    },
                    0
                  ]
                },
                attendance_type: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $and: [
                            { $gt: [{ $size: "$leaveData" }, 0] },
                            {
                              $eq: [
                                { $arrayElemAt: ["$leaveData.status", 0] },
                                "approved"
                              ]
                            }
                          ]
                        },
                        then: {
                          $cond: {
                            if: {
                              $or: [
                                {
                                  $eq: [
                                    { $arrayElemAt: ["$leaveData.session", 0] },
                                    "Session 1"
                                  ]
                                },
                                {
                                  $eq: [
                                    { $arrayElemAt: ["$leaveData.session", 0] },
                                    "Session 2"
                                  ]
                                }
                              ]
                            },
                            then: "HD", // Half-day leave
                            else: "L" // Full-day leave
                          }
                        }
                      },
                      {
                        case: { $eq: ["$status", true] },
                        then: "P" // Present
                      },
                      {
                        case: { $eq: ["$status", false] },
                        then: "A" // Absent
                      }
                    ],
                    default: "U" // Unknown
                  }
                },
                color: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$attendance_type", "P"] },
                        then: "30991F" // Green for Present
                      },
                      {
                        case: { $eq: ["$attendance_type", "A"] },
                        then: "FF0606" // Red for Absent
                      },
                      {
                        case: { $eq: ["$attendance_type", "L"] },
                        then: "0F137E" // Blue for Leave
                      },
                      {
                        case: { $eq: ["$attendance_type", "HD"] },
                        then: "FFA800" // Orange for Half-Day
                      }
                    ],
                    default: "000000" // Black for Unknown
                  }
                }
              }
            }
          ],
          as: "attendances"
        }
      },
      {
        $project: {
          empid: 1,
          firstname: 1,
          lastname: 1,
          attendances: 1
        }
      }
    ];

    const reportData = await Employee.aggregate(pipeline);

    if (!reportData || reportData.length === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the given range" });
    }

    res.status(200).json(reportData);
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  attendance,
  attendanceReport,
  todayAttendanceData,
  attendanceWeekReport,
  updateAttendance,
  TotalEmployee,
  employeeAttendanceReport,
  attendanceReportTesting
};
