const Attendance = require("../models/Attendance.model.js");
const ApiCRUDController = require("../controllers/ApiCrudController.js");
const Employee = require("../models/Employee.model.js");
const AttendanceModel = require("../models/Attendance.model.js");
const Holidays = require("../models/Holiday.model.js");
const Leave = require("../models/Leave.model.js");
const moment = require("moment");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");

const apiHandler = new ApiCRUDController(AttendanceModel);
const apiHandlerUSER = new ApiCRUDController(Employee);
const { create } = apiHandler;
const { readAllandPopulate } = apiHandlerUSER;

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

const attendanceReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    let firstDateOfMonth, lastDateOfMonth;

    if (month && year) {
      const yearInt = parseInt(year, 10);
      const monthInt = parseInt(month, 10) - 1;

      if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 0 || monthInt > 11) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      firstDateOfMonth =
        monthInt === 0
          ? new Date(yearInt - 1, 11, 26)
          : new Date(yearInt, monthInt - 1, 26);
      lastDateOfMonth = new Date(yearInt, monthInt, 25);
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      firstDateOfMonth =
        currentMonth === 0
          ? new Date(currentYear - 1, 11, 26)
          : new Date(currentYear, currentMonth - 1, 26);
      lastDateOfMonth = new Date(currentYear, currentMonth, 25);
    }

    // Format dates for querying
    const formatDateToISOString = (date, startOfDay = true) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const time = startOfDay ? "00:00:00.000" : "23:59:59.999";
      return `${year}-${month}-${day}T${time}+00:00`;
    };

    const employees = await Employee.find({
      $or: [{ status: "completed" }, { status: "InNoticePeriod" }]
    });

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    let attendanceReportData = [];

    // Define status-color mapping
    const statusColors = {
      present: { short: "P", color: "#30991F" },
      absent: { short: "A", color: "#FF0606" },
      half_leave: { short: "HD", color: "#FFA800" },
      full_leave: { short: "L", color: "#0F137E" }
    };

    for (let employee of employees) {
      const attendanceRecords = await Attendance.find({
        empid: employee._id,
        date: {
          $gte: formatDateToISOString(firstDateOfMonth, true),
          $lte: formatDateToISOString(lastDateOfMonth, false)
        }
      });

      // Process attendance records
      let formattedAttendance = attendanceRecords.map(record => {
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

      attendanceReportData.push({
        empid: employee._id,
        firstname: employee.firstname,
        middlename: employee.middlename,
        lastname: employee.lastname,
        name: `${employee.firstname} ${employee.lastname}`,
        attendance: formattedAttendance
      });
    }

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
    // Get today's start and end times
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

    // Fetch today's attendance records for all employees
    const attendanceRecords = await Attendance.find({
      empid: { $in: employeeIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Status colors for the different attendance types
    const statusColors = {
      present: { short: "P", color: "#30991F" },
      absent: { short: "A", color: "#FF0606" },
      half_leave: { short: "HD", color: "#FFA800" },
      full_leave: { short: "L", color: "#0F137E" }
    };

    // Build attendance report for each employee
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

    console.log(attendanceCounts, "attendanceCount");

    attendanceSummary.forEach(record => {
      attendanceCounts[record._id.toLowerCase()] = record.count;
    });

    res.status(200).json({
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
    const { empid, date, status } = req.body;

    if (!empid || !date || !updateby || status === undefined) {
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

    let attendance;

    if (status == "true") {
      attendance = "present";
    } else {
      attendance = "absent";
    }

    if (!attendanceRecord) {
      // Create new attendance record if not found
      await Attendance.create({
        empid,
        date: dateObj,
        status: attendance,
        updateby
      });

      return res.status(201).json({
        success: true,
        message: "Attendance record created successfully"
      });
    }

    // Update existing record
    attendanceRecord.updateby = updateby;
    attendanceRecord.status = status;
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
        return res.status(500).json({ message: assetLabels.fileUpload_error });
      }
      if (!req.file) {
        return res.status(400).json({ message: assetLabels.file_error });
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
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const empid = row.getCell(1).value;
        const date = moment(row.getCell(2).value, moment.ISO_8601, true);
        const status = row.getCell(3).value;

        if (empid && date.isValid() && status) {
          attendanceRecords.push({
            empid,
            date: new Date(date.toDate()),
            status
          });
        } else {
          console.warn(`Invalid row data at row ${rowNumber}:`, row.values);
        }
      });

      // Bulk insert attendance records
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

      const excelPath = `uploads/excel/${empId.employeeID}/${req.file
        .filename}`;
      const newExcelFile = new Excel({ excelfile: excelPath });
      await newExcelFile.save();

      fs.unlinkSync(filePath);

      res.status(200).json({ message: assetLabels.upload_And_save_message });
    } catch (error) {
      console.error("Error processing attendance:", error);
      return res
        .status(500)
        .json({ message: assetLabels.internal_server_message });
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
