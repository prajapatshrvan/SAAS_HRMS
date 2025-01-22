const AdvanceSalary = require("../models/advanceSalary.model");
const Employee = require("../models/Employee.model");
const adSalaryTransition = require("../models/advanceSalarytransions.model");
const multer = require("multer");
const { fileFilter } = require("../config/multer");
const fs = require("fs");
const moment = require("moment");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const empId = await Employee.findOne({ _id: req.user.userObjectId });
      if (!empId) {
        throw new Error("Employee not found");
      }

      let uploadPath = "uploads/" + empId.employeeID;

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

const upload = multer({
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
  storage: storage
}).single("attachment");

module.exports.createAdvanceSalary = async (req, res) => {
  upload(req, res, async err => {
    try {
      if (err) {
        console.error(err);
        return res.status(400).json({
          message: "File upload error",
          error: err.message
        });
      }

      const {
        advance_salary_type,
        amount,
        instalment,
        emi_amount,
        reason
      } = req.body;

      const empid = req.user.userObjectId;

      const empDetails = await Employee.findOne({ _id: empid });
      if (!empDetails) {
        return res.status(404).json({
          message: "Employee not found"
        });
      }

      const createdAt = moment(empDetails.createdAt);
      const currentDate = moment();
      const monthsOfService = currentDate.diff(createdAt, "months");

      if (monthsOfService < 6) {
        return res.status(403).json({
          message:
            "You are not eligible for advance salary as you have not completed six months of service"
        });
      }

      const advanceSalaryExist = await AdvanceSalary.findOne({
        $and: [{ empid }, { status: "pending" }]
      });

      if (advanceSalaryExist) {
        return res.status(409).json({
          message: "You have already applied for advance salary"
        });
      }

      const attachmentPath = req.file
        ? `uploads/${empDetails.employeeID}/${req.file.filename}`
        : null;

      const advanceSalary = new AdvanceSalary({
        empid,
        advance_salary_type,
        emiNumber: instalment,
        amount,
        instalment,
        emi_amount,
        reason,
        attachment: attachmentPath
      });

      await advanceSalary.save();

      return res.status(200).json({
        message: "Advance salary application submitted successfully"
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: error.message
      });
    }
  });
};

module.exports.AdvanceSalaryStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const approvedBy = req.user.userObjectId;
    let statuses = ["approved", "rejected", "cancelled"];
    if (statuses.includes(status)) {
      await AdvanceSalary.findByIdAndUpdate(id, {
        $set: {
          approvedBy: approvedBy,
          status: status
        }
      });
      return res.status(200).json({
        message: `AdvanceSalary ${status}`
      });
    } else {
      return res.status(400).json({
        message: "Invalid status Please Enter Valid Status"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.advanceSalaryList = async (req, res) => {
  try {
    const role = req.user.role_name;
    const empid = req.user.userObjectId;
    let query = {};

    if (role !== "ADMIN" && role !== "HR") {
      query = { empid: empid };
    }

    const advanceSalaryList = await AdvanceSalary.find(query)
      .populate({
        path: "empid",
        select: "firstname middlename lastname employeeID image"
      })
      .populate({
        path: "approvedBy",
        select: "firstname middlename lastname"
      });

    const modifiedList = advanceSalaryList.map(advanceSalary => {
      const { empid, approvedBy, ...rest } = advanceSalary._doc;
      const employee_name = `${empid.firstname} ${empid.lastname}`;
      const employeeID = empid.employeeID;
      const image = empid.image;
      const empId = empid._id;
      const approvedBy_name = `${approvedBy.firstname} ${approvedBy.lastname}`;
      return {
        ...rest,
        employee_name,
        employeeID,
        image,
        empId,
        approvedBy_name
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

module.exports.advanceSalarybyId = async (req, res) => {
  try {
    const id = req.params.id;
    const advanceSalary = await AdvanceSalary.findOne({ _id: id }).populate({
      path: "empid",
      select: "firstname middlename lastname employeeID image"
    });

    if (!advanceSalary) {
      return res.status(404).json({
        message: "Advance salary not found"
      });
    }

    const { empid, ...rest } = advanceSalary._doc;
    const employee_name = `${empid.firstname} ${empid.lastname}`;
    const employeeID = empid.employeeID;
    const image = empid.image;
    const empId = empid._id;

    const advanceSalaryData = {
      ...rest,
      employee_name,
      employeeID,
      image,
      empId
    };

    return res.status(200).json({
      data: advanceSalaryData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
