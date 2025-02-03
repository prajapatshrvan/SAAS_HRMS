const Leave = require("../models/Leave.model");
const Employee = require("../models/Employee.model");
const multer = require("multer");
const fs = require("fs");
const Attendance = require("../models/Attendance.model.js");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const emp = await Employee.findOne({ _id: req.user.userObjectId });
    let pathtoupload = `uploads/${emp.employeeID}`;
    if (!fs.existsSync(pathtoupload)) {
      fs.mkdirSync(pathtoupload, { recursive: true });
    }
    cb(null, `uploads/${emp.employeeID}`);
  },
  filename: (req, file, cb) => {
    const lastDotIndex = file.originalname.lastIndexOf(".");
    cb(
      null,
      file.originalname.slice(0, lastDotIndex).replace(" ", "_") + Date.now() + "." + file.originalname.split(".").pop()
    );
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }
}).single("document");

// module.exports.createLeave = async (req, res) => {
//   upload(req, res, async (err) => {
//     try {

//       if (err) {
//         console.error(err);
//         return res.status(400).json({ error: "File upload failed", err });
//       }

//       const { type, start_date, end_date, reason, session, requestto } = req.body;
//       let sdateParts = start_date.split("/");
//       let edateParts = end_date.split("/");

//       let sdate = new Date(`${sdateParts[2]}-${sdateParts[1]}-${sdateParts[0]}`);
//       let edate = new Date(`${edateParts[2]}-${edateParts[1]}-${edateParts[0]}`);

//       const existingLeave = await Leave.findOne({
//         empid: req.user.userObjectId,
//         $or: [
//           { start_date: { $lte: edate }, end_date: { $gte: sdate } },
//           { start_date: { $eq: sdate }, end_date: { $eq: edate } }
//         ]
//       }).sort({ createdAt: -1 });

//       if (existingLeave && (existingLeave.status === "approved" || existingLeave.status === "pending")) {
//         return res.status(400).json({ message: "You have already applied for leave during this period" });
//       }

//       const wordCount = reason.trim().split(/\s+/).length;
//       if (wordCount > 20) {
//         return res.status(400).json({ message: "Reason must be 20 words or fewer" });
//       }

//       let timeDifference = edate.getTime() - sdate.getTime();
//       let leave_days = timeDifference / (1000 * 3600 * 24);
//       leave_days = Math.round(leave_days + 1);

//       let currentDate = new Date();
//       currentDate.setDate(new Date().getDate() - 30);
//       if (sdate < currentDate) {
//         return res.status(400).json({ message: "Start date should not be older than 30 days from today." });
//       }

//       if (!type || !type.trim() || !reason.trim() || edate < sdate) {
//         return res.status(400).json({ message: "Invalid input data" });
//       }

//       if (sdate.toDateString() === edate.toDateString()) {
//         if (session === "Session 1" || session === "Session 2") {
//           leave_days = 0.5;
//         }
//       }

//       const emp = await Employee.findOne({ _id: req.user.userObjectId });
//       if (!emp) {
//         return res.status(400).json({ message: "Employee not found" });
//       }

//       await Leave.create({
//         empid: req.user.userObjectId,
//         type,
//         start_date: sdate,
//         end_date: edate,
//         session,
//         reason,
//         requestto,
//         leave_days,
//         document: req.file ? `uploads/${emp.employeeID}/${req.file.filename}` : null
//       });

//       return res.status(200).json({ message: "Leave created successfully" });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({
//         error: error,
//         message: "Internal server error"
//       });
//     }
//   });
// };


module.exports.createLeave = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: "File upload failed", err });
      }

      const { type, start_date, end_date, reason, session, requestto } = req.body;
      let sdateParts = start_date.split("/");
      let edateParts = end_date.split("/");

      let sdate = new Date(`${sdateParts[2]}-${sdateParts[1]}-${sdateParts[0]}`);
      let edate = new Date(`${edateParts[2]}-${edateParts[1]}-${edateParts[0]}`);

      // let sdate = new Date(start_date);
      // let edate = new Date(end_date);


      // Normalize Dates to Start of the Day (UTC)
      sdate.setUTCHours(0, 0, 0, 0);
      edate.setUTCHours(0, 0, 0, 0);

      const existingLeave = await Leave.findOne({
        empid: req.user.userObjectId,
        $or: [
          { start_date: { $lte: edate }, end_date: { $gte: sdate } },
          { start_date: { $eq: sdate }, end_date: { $eq: edate } }
        ]
      }).sort({ createdAt: -1 });

      if (existingLeave && (existingLeave.status === "approved" || existingLeave.status === "pending")) {
        return res.status(400).json({ message: "You have already applied for leave during this period" });
      }

      const wordCount = reason.trim().split(/\s+/).length;
      if (wordCount > 20) {
        return res.status(400).json({ message: "Reason must be 20 words or fewer" });
      }

      let timeDifference = edate.getTime() - sdate.getTime();
      let leave_days = timeDifference / (1000 * 3600 * 24);
      leave_days = Math.round(leave_days + 1);

      let currentDate = new Date();
      currentDate.setDate(new Date().getDate() - 30);
      if (sdate < currentDate) {
        return res.status(400).json({ message: "Start date should not be older than 30 days from today." });
      }

      if (!type || !type.trim() || !reason.trim() || edate < sdate) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      if (sdate.toDateString() === edate.toDateString()) {
        if (session === "Session 1" || session === "Session 2") {
          leave_days = 0.5;
        }
      }

      const emp = await Employee.findOne({ _id: req.user.userObjectId });
      if (!emp) {
        return res.status(400).json({ message: "Employee not found" });
      }

      const newLeave = await Leave.create({
        empid: req.user.userObjectId,
        type,
        start_date: sdate,
        end_date: edate,
        session,
        reason,
        requestto,
        leave_days,
        document: req.file ? `uploads/${emp.employeeID}/${req.file.filename}` : null
      });


      if (sdate.toDateString() === edate.toDateString() && (session === "Session 1" || session === "Session 2")) {
        let existingAttendance = await Attendance.findOne({
          empid: req.user.userObjectId,
          date: sdate
        });

        if (existingAttendance) {
          
          existingAttendance.status = "half_leave";
          await existingAttendance.save();
        } else {

          await Attendance.create({
            empid: req.user.userObjectId,
            date: sdate,
            status: "half_leave"
          });
        }
      }

      return res.status(200).json({ success: true, message: "Leave created successfully", leave: newLeave });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
};

module.exports.leaveList = async (req, res) => {
  try {
    const { role_name: role, userObjectId: empid } = req.user;

    const query = role !== "ADMIN" && role !== "HR" ? { empid } : {};

    const leaves = await Leave.find(query)
      .populate({ path: "empid", select: "firstname lastname employeeID" })
      .populate({ path: "approvedBy", select: "firstname lastname" })
      .sort({ createdAt: -1 });

    const flatData = leaves.map((leave) => {
      const { empid, approvedBy, ...rest } = leave._doc;
      return {
        ...rest,
        employee_name: empid ? `${empid.firstname} ${empid.lastname}` : null,
        employeeID: empid ? empid.employeeID : null,
        approved_by_name: approvedBy ? `${approvedBy.firstname} ${approvedBy.lastname}` : null,
      };
    });

    return res.status(200).json({ leave: flatData });
  } catch (error) {
    console.error("Error fetching leave list:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports.ApprovedLeave = async (req, res) => {
  try {
    const { leaveid, status } = req.body;

    if (!leaveid) {
      return res.status(400).json({
        message: "Please Enter Valid leaveId"
      });
    }

    let statuses = ["approved", "rejected", "cancelled", "withdrawn"];
    const approvedBy = req.user?.userObjectId

    if (statuses.includes(status)) {
      const leave = await Leave.findByIdAndUpdate(leaveid, { approvedBy : approvedBy, status: status }, { new: true });
      
      if (!leave) {
        return res.status(404).json({
          message: "Leave not found"
        });
      }

      return res.status(200).json({
        message: `Leave ${status}`
      });
    } else {
      return res.status(400).json({
        message: "Invalid Payload"
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.leavePendingList = async (req, res) => {
  try {
    const leave = await Leave.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.status(200).json({ leave: leave });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.leaveApprovedList = async (req, res) => {
  try {
    const leave = await Leave.find({ status: "approved" }).sort({ createdAt: -1 });
    return res.status(200).json({ leave: leave });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.leaveDelete = async (req, res) => {
  try {
    let leave = await Leave.deleteOne({ _id: req.body.id });
    if (leave) {
      res.status(200).json({
        message: "Delete Sucessfully"
      });
    } else {
      res.status(200).json({
        message: "Invalid Credentials"
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


module.exports.leaveCount = async (req, res) => {
  try {
    const { userObjectId } = req.user;
    const totalLeavesPerYear = 12;
    const leavesPerMonth = 1;

    const currentDate = new Date();
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1); 
    const monthsElapsed = currentDate.getMonth() + 1;


    const paidLeaves = monthsElapsed * leavesPerMonth;

    const leaves = await Leave.find({ empid: userObjectId, status: "approved" }).sort({ createdAt: -1 });

    const takenLeaves = leaves.reduce((accumulator, leave) => {
      return accumulator + (leave.leave_days || 0); 
    }, 0);

    const remainingLeaves = Math.max(0, paidLeaves - takenLeaves); 
    const unpaidLeaves = Math.max(0, takenLeaves - paidLeaves); 

    return res.status(200).json({
      totalLeavesPerYear,
      paidLeaves,
      takenLeaves,
      remainingLeaves,
      unpaidLeaves,
    });
  } catch (error) {
    console.error("Error fetching leave count:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
