const Employee = require("../models/Employee.model");
const EmpDocument = require("../models/EmpDocument.model");
const Leave = require("../models/Leave.model");
const Salaryslab = require("../models/SalarySalb.Model.js");
const multer = require("multer");
const { join } = require("path");
const fs = require("fs");
const Validation = require("../validationlable");
const { storage, fileFilter, updateStorage } = require("../config/multer");
const ApiCRUDController = require("./ApiCrudController");
const unlinkfile = require("../helpers/unlinkfile");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);
const transporter = require("../config/email_config.js");
const bcrypt = require("bcrypt");
const logger = require("../helpers/logger.js");
const generatePassword = require("../utility/generatePassword.js");
const { CLIENT_RENEG_LIMIT } = require("tls");
require("dotenv").config();

const upload = multer({
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
  storage: storage
}).fields([
  {
    name: "image"
  },
  {
    name: "aadhar_image"
  },
  {
    name: "pan_image"
  }
]);

const updateupload = multer({
  fileFilter: fileFilter,
  storage: updateStorage
}).fields([
  {
    name: "image"
  },
  {
    name: "aadhar_image"
  },
  {
    name: "pan_image"
  }
]);

module.exports.EmployeeAdd = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).send(err.message);
    }
    try {
      const {
        firstname,
        middlename,
        lastname,
        documentDob,
        originalDob,
        gender,
        email,
        mobile_number,
        emergency_number,
        aadharcard_no,
        pancard_no,
        family_member_first_name,
        family_member_last_name,
        relationship,
        family_member_dob,
        family_member_phone,
        family_member_email,
        marital_status,
        profile,
        joining_date
    
      } = req.body;

      // Capitalize function for first letters
      const capitalize = (string) => (string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : "");

      const capFirstName = capitalize(firstname);
      const capMiddleName = capitalize(middlename);
      const capLastName = capitalize(lastname);
      const capGender = capitalize(gender);
      const capFamilyMemberFirstName = capitalize(family_member_first_name);
      const capFamilyMemberLastName = capitalize(family_member_last_name);

      // Error object for validation
      let errors = {};

      // Validation checks
      const validations = [
        {
          valid: Validation.name_regex.test(firstname),
          field: "firstname",
          message: "Please provide a valid firstname"
        },
        // { valid: Validation.name_regex.test(lastname), field: "lastname", message: "Please provide a valid lastname" },
        { valid: Validation.email_regex.test(email), field: "email", message: "Please provide a valid email" },
        {
          valid: Validation.mobile_regex.test(mobile_number),
          field: "mobile_number",
          message: "Please provide a valid mobile number"
        },
        {
          valid: Validation.mobile_regex.test(emergency_number),
          field: "emergency_number",
          message: "Please provide a valid emergency mobile number"
        },
        {
          valid: Validation.aadhar_Regex.test(aadharcard_no),
          field: "aadharcard_no",
          message: "Please provide a valid Aadhar card number"
        },
        {
          valid: Validation.pan_Regex.test(pancard_no.toUpperCase()),
          field: "pancard_no",
          message: "Please provide a valid PAN card number"
        }
      ];

      validations.forEach(({ valid, field, message }) => {
        if (!valid) errors[field] = message;
      });

      if (mobile_number === emergency_number) {
        errors = "Emergency number cannot be the same as the mobile number";
      }

      if (Object.keys(errors).length) {
        logger.error(errors);
        return res.status(400).json({ errors });
      }

      const existFields = [
        { key: "email", value: email },
        { key: "aadharcard_no", value: aadharcard_no },
        { key: "pancard_no", value: pancard_no.toUpperCase() }
      ];

      for (let { key, value } of existFields) {
        if (await Employee.findOne({ [key]: value })) {
          return res.status(409).json({ errors: `${key.replace("_", " ")} already exists` });
        }
      }

      // Generate employee ID based on DOB and mobile number
      const year = documentDob.slice(0, 2);
      const mobileLast4 = mobile_number.slice(-4);
      const base_empId = `${year}${mobileLast4}`;
      let employeeID = base_empId;
      let numCount = 1;

      while (await Employee.findOne({ employeeID })) {
        employeeID = `${base_empId}${numCount++}`;
      }

      const imagePaths = req.files
        ? {
          image: req.files.image ? `uploads/${employeeID}/${req.files.image[0].filename}` : null,
          aadhar_image: `uploads/${employeeID}/${req.files.aadhar_image[0].filename}`,
          pan_image: `uploads/${employeeID}/${req.files.pan_image[0].filename}`
        }
        : {};

      // Create employee object
      const employee = new Employee({
        employeeID,
        firstname: capFirstName,
        middlename: capMiddleName || "",
        lastname: capLastName,
        ...imagePaths,
        documentDob,
        originalDob,
        gender: capGender,
        email: email.toLowerCase(),
        mobile_number,
        emergency_number,
        aadharcard_no,
        pancard_no: pancard_no.toUpperCase(),
        family_member_first_name: capFamilyMemberFirstName,
        family_member_last_name: capFamilyMemberLastName,
        relationship,
        family_member_dob,
        family_member_phone,
        family_member_email,
        profile,
        marital_status,
        joining_date
      });

      const data = await employee.save();
      return res.status(201).json({ data, error: "Employee details added successfully" });
    } catch (error) {
      console.error("Error in adding employee details:", error);
      return res.status(500).json({ error: "Internal server error.", error });
    }
  });
};

// Function to handle file updates and cleanup
const handleFileUpdate = (directoryPath, oldFile, newFile, fieldName) => {
  if (oldFile) {
    const oldFilePath = `${directoryPath}/${oldFile.slice(9 + directoryPath.length)}`;
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath); // Remove old file
    }
  }
  return `uploads/${directoryPath}/${newFile.filename}`;
};

module.exports.updateEmployee = async (req, res, next) => {
  try {
    updateupload(req, res, async (err) => {
      if (err) {
        console.log(err);
        console.error(err);
        return res.status(400).json({ error: "File upload failed", err });
      }

      const {
        empid,
        firstname,
        middlename,
        lastname,
        documentDob,
        originalDob,
        gender,
        email,
        mobile_number,
        emergency_number,
        aadharcard_no,
        pancard_no,
        family_member_first_name,
        family_member_last_name,
        relationship,
        family_member_dob,
        family_member_phone,
        family_member_email,
        marital_status,
        joining_date
      } = req.body;

      

      const emp = await Employee.findById(empid);
      if (!emp) {
        return res.status(404).json({ errors: "Employee not found" });
      }

      if (emp.email !== email) {
        const emailExist = await Employee.findOne({ email });
        if (emailExist) {
          return res.status(404).json({ errors: "Email already exist" });
        }
      }
      if (emp.aadharcard_no !== Number(aadharcard_no)) {
        const aadharExist = await Employee.findOne({ aadharcard_no });
        if (aadharExist) {
          return res.status(404).json({ errors: "Aadhaar number already exist" });
        }
      }

      if (emp.pancard_no !== pancard_no) {
        const panExist = await Employee.findOne({ pancard_no });
        if (panExist) {
          return res.status(404).json({ errors: "Pan card number already exist" });
        }
      }

      const employeeID = emp.employeeID;
      const directoryPath = join(process.cwd(), `uploads/${employeeID}`);

      // Build the update payload
      let updatePayload = {
        firstname,
        middlename,
        lastname,
        documentDob,
        originalDob,
        gender,
        email,
        mobile_number,
        emergency_number,
        aadharcard_no,
        pancard_no,
        family_member_first_name,
        family_member_last_name,
        relationship,
        family_member_dob,
        family_member_phone,
        family_member_email,
        marital_status,
        joining_date
      };

 

      

      if (req.files.image && req.files.image[0]) {
        if (fs.existsSync(emp.image)) {
          const imagepath = `${directoryPath}/${emp.image.slice(9 + emp.employeeID.length)}`;
          fs.unlinkSync(imagepath);
        }
        updatePayload.image = `uploads/${employeeID}/${req.files.image[0].filename}`;
      }

      if (req.files.aadhar_image && req.files.aadhar_image[0]) {
        if (fs.existsSync(emp.aadhar_image)) {
          const imagepath = `${directoryPath}/${emp.aadhar_image.slice(9 + emp.employeeID.length)}`;
          fs.unlinkSync(imagepath);
        }
        updatePayload.aadhar_image = `uploads/${employeeID}/${req.files.aadhar_image[0].filename}`;
      }

      if (req.files.pan_image && req.files.pan_image[0]) {
        if (fs.existsSync(emp.pan_image)) {
          const imagepath = `${directoryPath}/${emp.pan_image.slice(9 + emp.employeeID.length)}`;
          fs.unlinkSync(imagepath);
        }
        updatePayload.pan_image = `uploads/${employeeID}/${req.files.pan_image[0].filename}`;
      }

      // Update the employee data in parallel with file handling
      const updatedEmployee = await Employee.findByIdAndUpdate(empid, { $set: updatePayload }, { new: true })



      return res.status(200).json({
        data: updatedEmployee,
        message: "Employee details updated successfully"
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update Employee" });
  }
};


module.exports.EmployeeAddress = async (req, res, next) => {
  try {
    //
    if (!req.body) {
      return res.status(500).json({
        message: "please fill Address"
      });
    } else {
      let { empid } = req.body;

      if (!empid) {
        res.status(400).send("Invalid Employee ID. Please fill Employee ID");
      }
      try {
        let newTmpData = structuredClone(req.body);

        delete newTmpData._id;
        delete newTmpData.empid;
        let newEmpAddress = await Employee.findByIdAndUpdate(empid, { $set: newTmpData }, { new: true });

        return res.status(200).send({
          data: { ...newEmpAddress._doc, ...newTmpData },
          message: "Address save successfully"
        });
      } catch (e) {
        console.log(e);
        return next("Something went wrong");
      }

    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "internal server error",
      error: error
    });
  }
};

// documentupload multer
const storages = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // console.log(req.body.empid,"hello");
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

const uploaddoc = multer({
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
  storage: storages
}).any();

module.exports.addBankDetails = async (req, res) => {
  try {
    const { bank_name, account_no, ifsc_code, empid } = req.body;

    // Validation checks
    if (!bank_name || !bank_name.trim()) {
      return res.status(400).json({ message: "Please fill bank name" });
    }

    if (!account_no || !account_no.trim()) {
      return res.status(400).json({ message: "Please fill account no" });
    }

    // if (account_no.trim().length < 9 || account_no.trim().length > 17) {
    //   return res.status(400).json({ message: "Account number should be between 11 and 17 digits" });
    // }

    const accountNoregex = new RegExp(/^[0-9]{9,17}$/);

    if (!accountNoregex.test(account_no.trim())) {
      return res.status(400).json({ message: "Account number should be between 09 and 17 digits" });
    }

    const accountExist = await Employee.findOne({ "bankdetails.account_no": account_no });
    if (accountExist) {
      return res.status(400).json({ message: "Account number already exist" });
    }
    // if (!ifsc_code || !ifsc_code.trim()) {
    //   return res.status(400).json({ message: "Please Enter IFSC Code" });
    // }

    // const ifscRegex = /^[A-Z0-9]{11}$/;
    // if (!ifscRegex.test(ifsc_code.trim())) {
    //   return res.status(400).json({
    //     message: "IFSC code should consist of 4 capital alphabetic characters followed by 7 numeric digits"
    //   });
    // }

    // Create the bank details object
    const data = {
      bank_name: bank_name.trim(),
      account_no: account_no.trim(),
      ifsc_code: ifsc_code.trim().toUpperCase(),
      status: "approved"
    };

    // Update the employee's bank details
    const employee = await Employee.findByIdAndUpdate(
      empid,
      {
        $set: { bankdetails: data }
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({
      message: "Bank details added successfully",
      data: employee
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.adddepartment = async (req, res) => {
  try {
    const { company_email, department, designation, empid, country, state, city, zip } = req.body;
    const exist = await Employee.findOne({ company_email });
    if (exist) {
      return res.status(409).json({
        message: "Email Already Exists"
      });
    }

    function isCompanyEmail(company_email) {
      const companyDomains = ["singhsoft.com", "infovices.com", "singhtek.com"];
      const domainRegex = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
      const match = company_email.match(domainRegex);
      return match && companyDomains.includes(match[1]);
    }

    let errors = {};

    if (!empid || !empid.trim()) {
      errors.empid = "Please provide empid";
    }
    if (!isCompanyEmail(company_email)) {
      errors.company_email = "Please Enter Valid Email Domain (e.g., @singhsoft.com)";
    }
    if (!department || !department.trim()) {
      errors.department = "Department is required";
    }

    if (!designation || !designation.trim()) {
      errors.designation = "Designation is required";
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: errors });
    }

    const employee = await Employee.findOne({ _id: empid });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const worklocation = {
      country,
      state,
      city,
      zip
    };

    const setData = {
      company_email,
      department,
      designation,
      worklocation,
      status: "approved"
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(empid, {
      $set: setData
    });

    res.status(200).json({
      message: "Department added successfully",
      data: { ...updatedEmployee.toObject(), ...setData }
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

let modifyEmpData = (alldata, req) => {
  let empId = req?.user?.userObjectId;
  let data = [...alldata];
  let newData = [];

  for (let index = 0; index < data.length; index++) {
    const item = data[index];

    if (item._id != empId) {
      newData.push(item);
    }
  }

  return newData;
};


module.exports.EmployeeList = async (req, res) => {
  let statusParam = req.query.status;
  let statusList = {
    active: ["completed", "InNoticePeriod"],
    pending: "pending",
  };

  let empstatus = null;
  if (statusParam === "active" || statusParam === "pending") {
    empstatus = statusList[statusParam];
  }

  try {
    let employeeList;

    if (empstatus) {
      employeeList = await Employee.aggregate([
        { $match: { status: { $in: empstatus } } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "empdocuments",
            localField: "_id",
            foreignField: "empid",
            as: "documents",
          },
        },
        { $unwind: { path: "$documents", preserveNullAndEmptyArrays: true } }, // Flatten documents array
        { $unwind: { path: "$documents.experienceData", preserveNullAndEmptyArrays: true } }, // Flatten experienceData array
        {
          $project: {
            firstname: 1,
            lastname: 1,
            middlename: 1,
            mobile_number: 1,
            status: 1,
            employeeID: 1,
            image: 1,
            emergency_number: 1,
            department: 1,
            designation: 1,
            joining_date: 1,
            marital_status: 1,
            monthlycompensation: "$ctcDetails.monthlycompensation",
            bachelor_doc: "$documents.bachelor_doc",
            secondary_doc: "$documents.secondary_doc",
            senior_doc: "$documents.senior_doc",
            extra: "$documents.extra",
            companyname: "$documents.experienceData.companyname", 
            start_date: "$documents.experienceData.start_date",
            end_date: "$documents.experienceData.end_date",
            offerletter: "$documents.experienceData.offerletter",
            payslip: "$documents.experienceData.payslip",
          },
        },
      ]);
    } else {
      employeeList = await Employee.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "empdocuments",
            localField: "_id",
            foreignField: "empid",
            as: "documents",
          },
        },
        { $unwind: { path: "$documents", preserveNullAndEmptyArrays: true } }, 
        { $unwind: { path: "$documents.experienceData", preserveNullAndEmptyArrays: true } }, 
        {
          $project: {
            firstname: 1,
            lastname: 1,
            middlename: 1,
            mobile_number: 1,
            status: 1,
            employeeID: 1,
            image: 1,
            emergency_number: 1,
            department: 1,
            designation: 1,
            joining_date: 1,
            marital_status: 1,
            monthlycompensation: "$ctcDetails.monthlycompensation",
            bachelor_doc: "$documents.bachelor_doc",
            secondary_doc: "$documents.secondary_doc",
            senior_doc: "$documents.senior_doc",
            companyname: "$documents.experienceData.companyname", 
            start_date: "$documents.experienceData.start_date",
            end_date: "$documents.experienceData.end_date",
            offerletter: "$documents.experienceData.offerletter",
            payslip: "$documents.experienceData.payslip",
          },
        },
      ]);
    }

    return res.status(200).send(employeeList);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// employee status
module.exports.employeeStatus = async (req, res) => {
  try {
    const { empid, status } = req.body;
    let statuses = ["approved", "rejected", "completed", "InProbation", "InNoticePeriod", "Relieved"];
    if (statuses.includes(status)) {
      let data = await Employee.findByIdAndUpdate(empid, {
        $set: { status: status }
      });
      res.status(200).json({
        message: `status ${status} successfully`,
        data
      });
    } else {
      res.status(200).json({
        message: "invalid status"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.addctcdetails = async (req, res) => {
  try {
    const data = req.body;
    const dataPayload = {
      totalctc: data.totalctc,
      monthlycompensation: data.monthlycompensation,
    };

    let errors = {};

    if (!data || !data.totalctc || !data.totalctc.trim()) {
      errors.totalctc = "Total ctc is required";
      return res.status(400).json({ message: "Please fill Total ctc", errors });
    }

    // let min = 10000000;
    // let max = 99999999;
    // let password = Math.floor(Math.random() * (max - min + 1)) + min;
    // password = String(password);

    const password = generatePassword(8);

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const getemployee = await Employee.findOne({ _id: data.empid });
    if (!getemployee) {
      return res.status(404).send({ message: "No employee found" });
    }

    let company_email = getemployee?.company_email;

    const employee = await Employee.findByIdAndUpdate(data.empid, {
      $set: {
        ctcDetails: { ...dataPayload },
        password: hashPassword,
        resetpassword: true,
        status: "completed"
      }
    });

    const emailHtml = `your company email is: ${company_email} <br/> and Password is: ${password}`;
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: employee.email,
        subject: "HR-TOOLS - Email",
        html: emailHtml
      });

      return res.status(200).json({
        message: "Bank details Add successfully",
        data: employee
      });
    } catch (e) {
      return res.status(500).json({ message: "internal server error" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports.Employeedocument = async (req, res, next) => {
  uploaddoc(req, res, async (err) => {
    try {
      if (err) {
        let failedFields = req.files ? req.files.map((file) => file.fieldname) : [];
        return next({
          message: `File upload failed for fields: ${failedFields.join(", ") || "unknown fields"}`,
          status: 400,
          error: err.message
        });
      }

      const {
        empid,
        secondary_passing,
        senior_passing,
        bachelor_passing,
        undergraduate_passing,
        extraExperience,
        extraData,
        companyname,
        compensation,
        experienceletter,
        offerletter,
        start_date,
        end_date,
        payslip,
        relievingletter,
        resignationletter
      } = req.body;

      const empdata = await Employee.findOne({ _id: empid });
      if (!empdata) {
        return res.status(404).json({ error: "Employee not found" });
      }

      let empId = empdata._id;
      let empDocs = await EmpDocument.findOne({ empid: empId });

      let dataFiles = {};
      let extraExperienceData = extraExperience ? JSON.parse(extraExperience) : [];
      let extra = extraData ? JSON.parse(extraData) : [];

      req.files.forEach((file) => {
        let filePathName = `uploads/${empdata.employeeID}/${file.filename}`;

        extra.forEach((item) => {
          if (file.fieldname === item.degreeField) {
            item.degreefile = filePathName;
          }
        });

        extraExperienceData.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key === file.fieldname) {
              item[key] = filePathName;
            }
          });
        });

        if (file.fieldname && filePathName) {
          dataFiles[file.fieldname] = filePathName;
        }
      });

      let setUpdateData = {
        secondary_passing,
        senior_passing,
        bachelor_passing,
        undergraduate_passing,
        ...dataFiles,
        extra
      };

      if (companyname) {
        setUpdateData = {
          ...setUpdateData,
          companyname,
          start_date,
          end_date,
          extraExperienceData
        };
        delete setUpdateData.extra;
      }

      let expfiles = [
        "compensation",
        "experienceletter",
        "offerletter",
        "payslip",
        "relievingletter",
        "resignationletter"
      ];

      if (Object.keys(dataFiles).length > 0) {
        let includesExpfiles = expfiles.some((file) => dataFiles[file]);

        if (includesExpfiles) {
          let experienceData = {
            compensation,
            companyname,
            experienceletter,
            offerletter,
            payslip,
            relievingletter,
            resignationletter,
            start_date,
            end_date,
            ...dataFiles
          };
          setUpdateData.experienceData = experienceData;
        }
      }

      let empDocument;
      if (empDocs) {
        empDocument = await EmpDocument.findOneAndUpdate(
          { _id: empDocs._id },
          { $set: setUpdateData },
          { new: true, upsert: true }
        );
      } else {
        empDocument = new EmpDocument({
          empid: empId,
          secondary_passing,
          senior_passing,
          bachelor_passing,
          undergraduate_passing,
          ...dataFiles,
          extra
        });
        await empDocument.save();
      }

      return res.status(201).json({
        data: { ...empDocument._doc, documents: [setUpdateData] },
        message: "Employee document uploaded successfully"
      });
    } catch (error) {
      console.error("Internal server error", error);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  });
};


// module.exports.Employeedocument = async (req, res, next) => {
//   uploaddoc(req, res, async (err) => {
//     try {
//       // Handle file upload errors
//       if (err) {
//         const failedFields = req.files ? req.files.map((file) => file.fieldname) : [];
//         return next({
//           message: `File upload failed for fields: ${failedFields.join(", ") || "unknown fields"}`,
//           status: 400,
//           error: err.message
//         });
//       }

//       // Destructure body parameters
//       const {
//         empid,
//         secondary_passing,
//         senior_passing,
//         bachelor_passing,
//         undergraduate_passing,
//         extraExperience,
//         extraData,
//         companyname,
//         compensation,
//         experienceletter,
//         offerletter,
//         start_date,
//         end_date,
//         payslip,
//         relievingletter,
//         resignationletter
//       } = req.body;

//       // Fetch employee data
//       const empdata = await Employee.findById(empid);
//       if (!empdata) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       const empId = empdata._id;
//       const empDocs = await EmpDocument.findOne({ empid: empId });

//       // Parse extra experience and extra data
//       const extraExperienceData = extraExperience ? JSON.parse(extraExperience) : [];
//       const extra = extraData ? JSON.parse(extraData) : [];
//       const uploadedFiles = {};

//       // Process uploaded files and map them to the correct fields
//       req.files.forEach((file) => {
//         const filePath = `uploads/${empdata.employeeID}/${file.filename}`;
//         uploadedFiles[file.fieldname] = filePath;

//         // Update extra experience and extra data with file paths
//         extra.forEach((item) => {
//           if (file.fieldname === item.degreeField) {
//             item.degreefile = filePath;
//           }
//         });

//         extraExperienceData.forEach((item) => {
//           Object.keys(item).forEach((key) => {
//             if (key === file.fieldname) {
//               item[key] = filePath;
//             }
//           });
//         });
//       });

//       // Prepare data to update
//       const setUpdateData = {
//         secondary_passing,
//         senior_passing,
//         bachelor_passing,
//         undergraduate_passing,
//         extraExperienceData,
//         extra,
//         ...uploadedFiles,
//       };


//       if (companyname) {
//         setUpdateData.companyname = companyname;
//         setUpdateData.start_date = start_date;
//         setUpdateData.end_date = end_date;
//       }

//       // Experience-related files
//       const expFiles = [
//         "compensation",
//         "experienceletter",
//         "offerletter",
//         "payslip",
//         "relievingletter",
//         "resignationletter"
//       ];

//       let experienceData = {};

//       expFiles.forEach((file) => {
//         if (uploadedFiles[file]) {
//           experienceData[file] = uploadedFiles[file];
//         }
//       });


//       // If there are experience files, include them in the data
//       if (Object.keys(experienceData).length > 0) {
//         setUpdateData.experienceData = { ...experienceData, companyname, start_date, end_date };
//       }

//       let empDocument;
//       if (empDocs) {
//         empDocument = await EmpDocument.findOneAndUpdate(
//           { empid: empId },
//           { $set: setUpdateData },
//           { new: true, upsert: true }
//         );
//       } else {
//         empDocument = new EmpDocument({
//           empid: empId,
//           ...setUpdateData
//         });
//         await empDocument.save();
//       }

//       return res.status(201).json({
//         message: "Employee document uploaded successfully",
//         data: empDocument,
//       });
//     } catch (error) {
//       console.error("Internal server error", error);
//       return res.status(500).json({
//         message: "Internal server error",
//       });
//     }
//   });
// };










