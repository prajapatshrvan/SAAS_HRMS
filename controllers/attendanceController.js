const Attendance = require("../models/Attendance.model.js");
const Employee = require("../models/Employee.model.js");
const Holidays = require("../models/Holiday.model.js");
const Leave = require("../models/Leave.model.js");
const moment = require("moment");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");

// const apiHandler = new ApiCRUDController(AttendanceModel);
// const apiHandlerUSER = new ApiCRUDController(Employee);
// const { create } = apiHandler;
// const { readAllandPopulate } = apiHandlerUSER;

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const empId = await Employee.findOne({ _id: req.user.userObjectId });
      if (!empId) {
        throw new Error("Employee not found");
      }

      let uploadPath = "uploads/excel";
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    } catch (error) {
      console.error("Error in finding employee ID:", error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const lastDotIndex = file.originalname.lastIndexOf(".");
    cb(
      null,
      file.originalname.slice(0, lastDotIndex).replace(" ", "_") +
        Date.now() +
        "." +
        file.originalname.split(".").pop()
    );
  }
});

const uploadExcel = multer({
  storage: storage
}).single("excel");

const attendance = async (req, res, next) => {
  try {
    const requestData = req.body.attendance;

    if (!requestData || requestData.length === 0) {
      return res.status(400).send("Please send valid attendance data");
    }

    const currentDate = new Date();
    let errors = [];

    for (const element of requestData) {
      const { empid, date, status } = element;

      if (!empid || !date || status === undefined) {
        errors.push({ empid, message: "Invalid employee details" });
        continue;
      }

      // Convert date properly
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        errors.push({ empid, message: "Invalid date format" });
        continue;
      }
      attendanceDate.setUTCHours(0, 0, 0, 0);

      // Check if the date is within the last 7 days
      if (currentDate - attendanceDate > 7 * 24 * 60 * 60 * 1000) {
        errors.push({ empid, message: "Invalid date: Out of allowed range" });
        continue;
      }

      // Fetch approved leave for the employee
      const leave = await Leave.findOne({
        empid,
        status: "approved",
        start_date: { $lte: attendanceDate },
        end_date: { $gte: attendanceDate }
      });

      let finalStatus = status ? "present" : "absent";

      if (leave && leave.session) {
        finalStatus =
          leave.session === "Session 1" || leave.session === "Session 2"
            ? "half_leave"
            : "full_leave";
      }

      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        empid,
        date: attendanceDate
      });

      if (existingAttendance) {
        try {
          await Attendance.updateOne(
            { empid, date: attendanceDate },
            { $set: { status: finalStatus } }
          );
        } catch (error) {
          errors.push({ empid, message: "Error updating attendance" });
          console.error("Error updating attendance:", error);
        }
      } else {
        try {
          await Attendance.create({
            empid,
            date: attendanceDate,
            status: finalStatus
          });
        } catch (error) {
          errors.push({ empid, message: "Error creating attendance" });
          console.error("Error creating attendance:", error);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    res
      .status(200)
      .json({ success: true, message: "Attendance processed successfully" });
  } catch (error) {
    console.error("Error processing attendance:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const attendanceReport = async (req, res) => {
  try {
    const { month, year, search } = req.query;

    // Validate month & year
    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10) - 1;

    if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 0 || monthInt > 11) {
      return res.status(400).json({ error: "Invalid year or month" });
    }

    // Define date range
    const firstDateOfMonth = new Date(yearInt, monthInt - 1, 26);
    const lastDateOfMonth = new Date(yearInt, monthInt, 25);

    const matchStage = {
      status: { $in: ["completed", "InNoticePeriod"] }
    };

    if (search && search.trim()) {
      matchStage.$or = [
        { firstname: { $regex: new RegExp(search, "i") } },
        { lastname: { $regex: new RegExp(search, "i") } }
      ];
    }

    // MongoDB Aggregation Pipeline
    const attendanceReportData = await Employee.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "empid",
          pipeline: [
            {
              $match: {
                date: { $gte: firstDateOfMonth, $lte: lastDateOfMonth }
              }
            },
            {
              $project: {
                _id: 0,
                date: 1,
                status: {
                  $toLower: "$status"
                }
              }
            }
          ],
          as: "attendance"
        }
      },
      {
        $addFields: {
          attendance: {
            $map: {
              input: "$attendance",
              as: "record",
              in: {
                date: "$$record.date",
                status: {
                  $ifNull: [
                    {
                      $let: {
                        vars: {
                          mapping: {
                            present: "P",
                            absent: "A",
                            half_leave: "HD",
                            full_leave: "L"
                          }
                        },
                        in: {
                          $getField: {
                            input: "$$mapping",
                            field: "$$record.status"
                          }
                        }
                      }
                    },
                    "$$record.status"
                  ]
                },
                color: {
                  $ifNull: [
                    {
                      $let: {
                        vars: {
                          mapping: {
                            present: "#30991F",
                            absent: "#FF0606",
                            half_leave: "#FFA800",
                            full_leave: "#0F137E"
                          }
                        },
                        in: {
                          $getField: {
                            input: "$$mapping",
                            field: "$$record.status"
                          }
                        }
                      }
                    },
                    "#000000"
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          empid: "$_id",
          firstname: 1,
          middlename: 1,
          lastname: 1,
          name: { $concat: ["$firstname", " ", "$lastname"] },
          attendance: 1
        }
      }
    ]);

    res.status(200).json(attendanceReportData);
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).json({
      error: "An error occurred while generating the attendance report."
    });
  }
};

const getStartAndEndOfWeek = () => {
  const today = new Date();
  const first = today.getDate() - today.getDay(); // Sunday as first day
  const last = first + 6; // Saturday as last day

  const startOfWeek = new Date(today.setDate(first));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today.setDate(last));
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startOfWeek: startOfWeek.toISOString(),
    endOfWeek: endOfWeek.toISOString()
  };
};

const attendanceWeekReport = async (req, res, next) => {
  try {
    const { startOfWeek, endOfWeek } = getStartAndEndOfWeek();

    const employees = await Employee.find({
      $or: [{ status: "completed" }, { status: "InNoticePeriod" }]
    });

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    const employeeIds = employees.map(emp => emp._id);

    const attendanceRecords = await Attendance.find({
      empid: { $in: employeeIds },
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    const statusColors = {
      present: { short: "P", color: "#30991F" }, // Green
      absent: { short: "A", color: "#FF0606" }, // Red
      half_leave: { short: "HD", color: "#FFA800" }, // Orange (Half Day)
      full_leave: { short: "L", color: "#0F137E" } // Blue (Leave)
    };

    const attendanceReportData = employees.map(employee => {
      const empAttendance = attendanceRecords
        .filter(record => record.empid.toString() === employee._id.toString())
        .map(record => {
          const statusKey = record.status.toLowerCase();
          const statusInfo = statusColors[statusKey] || {
            short: record.status,
            color: "#000000"
          };

          return {
            date: record.date,
            status: statusInfo.short,
            color: statusInfo.color
          };
        });

      return {
        empid: employee._id,
        name: `${employee.firstname} ${employee.lastname}`,
        attendance: empAttendance
      };
    });

    res.status(200).json(attendanceReportData);
  } catch (error) {
    console.error("Error fetching weekly attendance report:", error);
    res.status(500).json({
      error: "An error occurred while processing data."
    });
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
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    const employees = await Employee.find({
      $or: [{ status: "completed" }, { status: "InNoticePeriod" }]
    });

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    const employeeIds = employees.map(emp => emp._id);

    const attendanceRecords = await Attendance.find({
      empid: { $in: employeeIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const statusColors = {
      present: { short: "P", color: "#30991F" },
      absent: { short: "A", color: "#FF0606" },
      half_leave: { short: "HD", color: "#FFA800" },
      full_leave: { short: "L", color: "#0F137E" }
    };

    const attendanceReportData = employees.map(employee => {
      const empAttendance = attendanceRecords
        .filter(record => record.empid.toString() === employee._id.toString())
        .map(record => {
          const statusKey = record.status.toLowerCase();
          const statusInfo = statusColors[statusKey] || {
            short: record.status,
            color: "#000000"
          };

          return {
            date: record.date,
            status: statusInfo.short,
            color: statusInfo.color
          };
        });

      return {
        empid: employee._id,
        name: `${employee.firstname} ${employee.lastname}`,
        attendance: empAttendance
      };
    });

    res.status(200).json(attendanceReportData);
  } catch (error) {
    console.error("Error fetching today's attendance report:", error);
    res.status(500).json({
      error: "An error occurred while processing data."
    });
  }
};

const TotalEmployee = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setUTCHours(23, 59, 59, 999));

    const totalEmployee = await Employee.countDocuments({
      status: { $in: ["completed", "inNoticePeriod"] }
    });

    const attendanceSummary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const attendanceCounts = {
      present: 0,
      absent: 0,
      half_leave: 0,
      full_leave: 0,
      holiday: 0
    };

    attendanceSummary.forEach(record => {
      attendanceCounts[record._id.toLowerCase()] = record.count;
    });

    res.status(200).json({
      totalEmployeeCount: totalEmployee,
      TotalEmployeePresent: attendanceCounts.present,
      TotalEmployeeAbsent: attendanceCounts.absent,
      TotalEmployeeHalfDay: attendanceCounts.half_leave,
      TotalEmployeeFullLeave: attendanceCounts.full_leave,
      TotalEmployeeHoliday: attendanceCounts.holiday
    });
  } catch (error) {
    console.error("Error fetching total employee count:", error);
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const updateby = req.user.userObjectId;
    const { empid, date, attendance } = req.body;

    if (!empid || !date || !attendance) {

      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    dateObj.setUTCHours(0, 0, 0, 0);

    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    if (dateObj < startOfMonth || dateObj > currentDate) {
      return res.status(403).json({
        success: false,
        message: "Cannot update attendance record outside of the current month"
      });
    }

    let attendanceRecord = await Attendance.findOne({ empid, date: dateObj });

    let attendancevalue;

    if (attendance == "present") {
      attendancevalue = "present";
    } else if (attendance == "absent") {
      attendancevalue = "absent";
    } else if (attendance == "leave") {
      attendancevalue = "full_leave";
    } else if (attendance == "half_day") {
      attendancevalue = "half_leave";
    }

    if (!attendanceRecord) {
      // Create new attendance record if not found
      await Attendance.create({
        empid,
        date: dateObj,
        status: attendancevalue,
        updateby
      });

      return res.status(201).json({
        success: true,
        message: "Attendance record created successfully"
      });
    }

    // Update existing record
    attendanceRecord.updateby = updateby;
    attendanceRecord.status = attendancevalue;
    await attendanceRecord.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully"
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    next(error);
  }
};

const employeeAttendanceReport = async (req, res, next) => {
  try {
    const empid = req.user.userObjectId;
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
      59,
      999
    );

    const statusColors = {
      present: { short: "P", color: "#30991F" },
      absent: { short: "A", color: "#FF0606" },
      half_leave: { short: "HD", color: "#FFA800" },
      full_leave: { short: "L", color: "#0F137E" }
    };
    const employee = await Employee.findById(empid);

    const attendanceReport = await Attendance.find({
      empid: empid,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Return the attendance report data
    return res.status(200).json({
      data: attendanceReport
    });
  } catch (error) {
    next(error);
  }
};

const biometricAttendance = async (req, res) => {
  uploadExcel(req, res, async err => {
    try {
      if (err) {
        console.error("File upload error:", err);
        return res.status(500).json({ message: "File upload error" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return res
          .status(400)
          .json({ message: "Worksheet not found in the Excel file." });
      }

      const attendanceRecords = [];
      const errors = [];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const empid = row.getCell(1).value;
        const date = new Date(row.getCell(2).value);
        const status = row.getCell(3).value;

        const validStatuses = [
          "present",
          "absent",
          "half_leave",
          "full_leave",
          "quarter_leave"
        ];

        if (!validStatuses.includes(status)) {
          errors.push(`Invalid attendance status at row ${rowNumber}`);
          return;
        }

        if (empid && date && status) {
          attendanceRecords.push({
            empid,
            date: date,
            status
          });
        } else {
          errors.push(`Invalid data at row ${rowNumber}`);
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      if (attendanceRecords.length > 0) {
        await Attendance.insertMany(attendanceRecords);
      } else {
        return res
          .status(400)
          .json({ message: "No valid attendance records found in the file." });
      }

      // Save Excel file information
      const empId = await Employee.findOne({ _id: req.user.userObjectId });
      if (!empId) {
        return res.status(404).json({ message: "Employee not found." });
      }

      // const excelPath = `uploads/excel/${empId.employeeID}/${req.file
      //   .filename}`;
      // const newExcelFile = new Excel({ excelfile: excelPath });
      // await newExcelFile.save();

      // fs.unlinkSync(filePath);

      return res
        .status(200)
        .json({ message: "Excel File uploaded and saved successfully" });
    } catch (error) {
      console.error("Error processing attendance:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
};

module.exports = {
  attendance,
  attendanceReport,
  todayAttendanceData,
  attendanceWeekReport,
  updateAttendance,
  TotalEmployee,
  employeeAttendanceReport,
  biometricAttendance
};
