const multer = require("multer");
const fs = require("fs");
const Employee = require("../models/Employee.model");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const exist = await Employee.findOne({ email: req.body.email });
      if (exist) {
        cb(null, `uploads/${exist.employeeID}`);
      } else {
        const base_empId = `${req.body.documentDob.slice(0, 2)}${req.body.mobile_number.slice(-4)}`;

        let employeeID = base_empId;
        let numCount = 1;
        let existingEmp;
        do {
          existingEmp = await Employee.findOne({ employeeID });
          if (existingEmp) {
            employeeID = base_empId + numCount;
            numCount++;
          }
        } while (existingEmp);
        const uploadPath = `uploads/${employeeID}`;
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      }
    } catch (error) {
      console.error("Error in handling file upload destination:", error);
      cb(error, null);
    }
  },

  filename: (req, file, cb) => {
    const lastDotIndex = file.originalname.lastIndexOf(".");
    cb(
      null,
      file.originalname.slice(0, lastDotIndex).replace(" ", "_") + Date.now() + "." + file.originalname.split(".").pop()
    );
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageExtensions = ["png", "jpg", "jpeg"];
  const allowedDocumentExtensions = ["pdf", "doc"];

  const fileExtension = file.originalname.split(".").pop().toLowerCase();
  const mimeTypeExtension = file.mimetype.split("/").pop().toLowerCase();

  if (
    allowedImageExtensions.includes(fileExtension) ||
    allowedImageExtensions.includes(mimeTypeExtension) ||
    allowedDocumentExtensions.includes(fileExtension) ||
    allowedDocumentExtensions.includes(mimeTypeExtension)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

module.exports = fileFilter;

const updateStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const empId = await Employee.findOne({ _id: req.body.empid });
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
      file.originalname.slice(0, lastDotIndex).replace(" ", "_") + Date.now() + "." + file.originalname.split(".").pop()
    );
  }
});

module.exports = { storage, fileFilter, updateStorage };
