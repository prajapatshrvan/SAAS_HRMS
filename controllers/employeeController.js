const Employee = require("../models/Employee.model");
const EmpDocument = require("../models/EmpDocument.model");

const multer = require("multer");
const { join } = require("path");
const fs = require("fs"); 
const Validation = require("../validationlable");
const { storage, fileFilter, updateStorage } = require("../config/multer");


const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);   
const transporter = require("../config/email_config.js");
const bcrypt = require("bcrypt");
const logger = require("../helpers/logger.js");
const generatePassword = require("../utility/generatePassword.js");
const {addEmployees} = require("../utility/esslFunction.js");
const { CLIENT_RENEG_LIMIT } = require("tls");
const Company = require("../models/Company.model");
const { default: mongoose } = require("mongoose");
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


module.exports.companyList = async (req, res, next) => {
  try {
    const company = await Company.find()
    if(!company){
      return res.status(400).json({message : "Data not found"})
    }
      return res.status(200).json({
        data: company,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update Employee" });
  }
};

module.exports.EmployeeAdd = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).send(err.message);
    }
    try {
      const {
        // firstname,
        // middlename,
        // lastname,
        // documentDob,
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
        joining_date,
        pf_number,
        company_name,
        company_email,
        uan_number,
        role
    
      } = req.body;

      const employee = await Employee.findOne({company_email : company_email})

      if(!employee){
        return res.status(400).json({message : "Employee not found"})
      }

      const employeeID = employee.employeeID

      const capitalize = (string) => (string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : "");

      // const capFirstName = capitalize(firstname);
      // const capMiddleName = capitalize(middlename);
      // const capLastName = capitalize(lastname);
      const capGender = capitalize(gender);
      const capFamilyMemberFirstName = capitalize(family_member_first_name);
      const capFamilyMemberLastName = capitalize(family_member_last_name);

      // Error object for validation
      let errors = {};

      // Validation checks
      const validations = [
        // {
        //   valid: Validation.name_regex.test(firstname),
        //   field: "firstname",
        //   message: "Please provide a valid firstname"
        // },
        // { valid: Validation.name_regex.test(lastname), field: "lastname", message: "Please provide a valid lastname" },
        { valid: Validation.email_regex.test(email), field: "email", message: "Please provide a valid email" },
        // {
        //   valid: Validation.mobile_regex.test(mobile_number),
        //   field: "mobile_number",
        //   message: "Please provide a valid mobile number"
        // },
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
        },
        
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
      // const year = documentDob.slice(0, 2);
      // const mobileLast4 = mobile_number.slice(-4);
      // const base_empId = `${year}${mobileLast4}`;
      // let employeeID = base_empId;
      // let numCount = 1;

      // while (await Employee.findOne({ employeeID })) {
      //   employeeID = `${base_empId}${numCount++}`;
      // }



      const imagePaths = req.files
        ? {
          image: req.files.image ? `uploads/${employeeID}/${req.files.image[0].filename}` : null,
          aadhar_image: `uploads/${employeeID}/${req.files.aadhar_image[0].filename}`,
          pan_image: `uploads/${employeeID}/${req.files.pan_image[0].filename}`
        }
        : {};

      // Create employee object
      const emp = new Employee({
        // employeeID,
        // firstname: capFirstName,
        // middlename: capMiddleName || "",
        // lastname: capLastName,
        ...imagePaths,
        // documentDob,
        originalDob,
        gender: capGender,
        email: email.toLowerCase(),
        // mobile_number,
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
        joining_date,
        pf_number,
        company_name,
        uan_number,
        role
      });

      const data = await emp.save();
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
        joining_date,
        pf_number,
        company_name,
        uan_number,
        role
      } = req.body;


      const emp = await Employee.findById(empid);
      if (!emp) {
        return res.status(404).json({ errors: "Employee not found" });
      }

      if (emp.email !== email) {
        const emailExist = await Employee.findOne({ email });
        if (emailExist) {
          return res.status(409).json({ errors: "Email already exists" });
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
        joining_date,
        pf_number,
        company_name,
        uan_number,
        role
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
    const { company_email, department, designation, empid, country, state, city, zip, role } = req.body;

    // Check if company email already exists
    const exist = await Employee.findOne({ company_email });
    if (exist && exist.company_email !== company_email) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Validate email domain
    // function isCompanyEmail(email) {
    //   const allowedDomains = ["singhsoft.com", "infovices.com", "singhtek.com"];
    //   const domain = email.split("@").pop();
    //   return allowedDomains.includes(domain);
    // }

    let errors = {};

    if (!empid || !empid.trim()) {
      errors.empid = "Please provide empid";
    }
    // if (!isCompanyEmail(company_email)) {
    //   errors.company_email = "Please enter a valid email domain (e.g., @singhsoft.com)";
    // }
    if (!department || !department.trim()) {
      errors.department = "Department is required";
    }
    if (!designation || !designation.trim()) {
      errors.designation = "Designation is required";
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: errors });
    }

    const employee = await Employee.findById(empid);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const worklocation = { country, state, city, zip };

    const setData = {
      company_email,
      department,
      designation,
      worklocation,
      role,
      status: "approved"
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      empid,
      { $set: setData },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Department added successfully",
      data: updatedEmployee
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
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
  let { status, search, month, year } = req.query;
  let userId = req.user?.userObjectId; 
  let role = req.role_name; 

  let statusList = {
    active: ["completed", "InNoticePeriod"],
    pending: "pending",
  };

  let empstatus = statusList[status] || null;

  try {
    let matchStage = {};

    if (role !== "ADMIN") {
      matchStage._id = new mongoose.Types.ObjectId(userId); 
    }

    
    if (empstatus) {
      matchStage.status = { $in: empstatus };
    }

    if (search) {
      const nameParts = search.trim().split(/\s+/);
      matchStage.$or = nameParts.length > 1 ? [
        {
          $and: [
            { employeeID: { $regex: `^${String(nameParts[0])}`, $options: "i" } },
            { firstname: { $regex: `^${nameParts[1]}`, $options: "i" } },
            { lastname: { $regex: `^${nameParts[2]}`, $options: "i", $exists: true } },
          ],
        },
        {
          $and: [
            { firstname: { $regex: `^${nameParts[0]}`, $options: "i" } },
            { middlename: { $regex: `^${nameParts[1]}`, $options: "i" } },
            { lastname: { $regex: `^${nameParts[2]}`, $options: "i" } },
          ],
        },
      ] : [
        { employeeID: { $regex: `^${String(search)}`, $options: "i" } },
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
      ];
    }

    if (month && year) {
      let startDate = new Date(year, month - 1, 1);
      let endDate = new Date(year, month, 1);
      matchStage.joining_date = { $gte: startDate, $lt: endDate };
    }

    
    let employeeList = await Employee.aggregate([
      { $match: matchStage },
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
          company_email : 1,
          documentDob : 1,
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
          totalctc: "$ctcDetails.totalctc",
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

    // Check if employees exist
    if (!employeeList.length) {
      return res.status(404).json({ message: "No employees found matching the criteria." });
    }

    return res.status(200).send(employeeList);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; 

const calculateLeaves = (joiningDate) => {
  const joinDate = new Date(joiningDate);
  const currentYear = new Date().getFullYear();
  
  if (joinDate.getFullYear() === currentYear) {
    const joinMonth = joinDate.getMonth() + 1; 
    return 13 - joinMonth; 
  } 
  
  return 12; 
};

// employee status
module.exports.employeeStatus = async (req, res) => {
  try {
    const { empid, status } = req.body;

    const validStatuses = new Set([
      "approved", "rejected", "completed", "InProbation", "InNoticePeriod", "close"
    ]);

    if (!validStatuses.has(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const employee = await Employee.findById(empid);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // const joiningDate = new Date(employee.joining_date || employee.createdAt).toLocaleDateString();

  
    // const totalLeave = calculateLeaves(joiningDate);


    const updatedEmployee = await Employee.findByIdAndUpdate(
      empid,
      { $set: { status : status} },
      { new: true } 
    );

    res.status(200).json({
      message: `Status updated to ${status} successfully`,
      data: updatedEmployee
    });

  } catch (error) {
    console.error("Error updating employee status:", error);
    res.status(500).json({ message: "Internal server error" });
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

    // const password = generatePassword(8);

    // const salt = await bcrypt.genSalt(10);
    // const hashPassword = await bcrypt.hash(password, salt);

    const getemployee = await Employee.findOne({ _id: data.empid });
    if (!getemployee) {
      return res.status(404).send({ message: "No employee found" });
    }

    let company_email = getemployee?.company_email;

    const employee = await Employee.findByIdAndUpdate(data.empid, {
      $set: {
        ctcDetails: { ...dataPayload },
        // password: hashPassword,
        resetpassword: true,
        status: "completed"
      }
    });

    // const emailHtml = `your company email is: ${company_email} <br/> and Password is: ${password}`;
    try {
      // const info = await transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: employee.email,
      //   subject: "HR-TOOLS - Email",
      //   html: emailHtml
      // });

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
      message: "Internal server error",
      error : error.message
    });
  }
};

// module.exports.Employeedocument = async (req, res, next) => {
//   uploaddoc(req, res, async (err) => {
//     try {
//       if (err) {
//         let failedFields = req.files ? req.files.map((file) => file.fieldname) : [];
//         return next({
//           message: `File upload failed for fields: ${failedFields.join(", ") || "unknown fields"}`,
//           status: 400,
//           error: err.message
//         });
//       }

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

//       const empdata = await Employee.findOne({ _id: empid });
//       if (!empdata) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       let empId = empdata._id;
//       let empDocs = await EmpDocument.findOne({ empid: empId });

//       let dataFiles = {};
//       let extraExperienceData = extraExperience ? JSON.parse(extraExperience) : [];
//       let extra = extraData ? JSON.parse(extraData) : [];

//       req.files.forEach((file) => {
//         let filePathName = `uploads/${empdata.employeeID}/${file.filename}`;

//         extra.forEach((item) => {
//           if (file.fieldname === item.degreeField) {
//             item.degreefile = filePathName;
//           }
//         });

//         extraExperienceData.forEach((item) => {
//           Object.keys(item).forEach((key) => {
//             if (key === file.fieldname) {
//               item[key] = filePathName;
//             }
//           });
//         });

//         if (file.fieldname && filePathName) {
//           dataFiles[file.fieldname] = filePathName;
//         }
//       });

//       let setUpdateData = {
//         secondary_passing,
//         senior_passing,
//         bachelor_passing,
//         undergraduate_passing,
//         ...dataFiles,
//         extra
//       };

//       if (companyname) {
//         setUpdateData = {
//           ...setUpdateData,
//           companyname,
//           start_date,
//           end_date,
//           extraExperienceData
//         };
//         delete setUpdateData.extra;
//       }

//       let expfiles = [
//         "compensation",
//         "experienceletter",
//         "offerletter",
//         "payslip",
//         "relievingletter",
//         "resignationletter"
//       ];

//       if (Object.keys(dataFiles).length > 0) {
//         let includesExpfiles = expfiles.some((file) => dataFiles[file]);

//         if (includesExpfiles) {
//           let experienceData = {
//             compensation,
//             companyname,
//             experienceletter,
//             offerletter,
//             payslip,
//             relievingletter,
//             resignationletter,
//             start_date,
//             end_date,
//             ...dataFiles
//           };
//           setUpdateData.experienceData = experienceData;
//        }
//       }

//       let empDocument;
//       if (empDocs) {
//         empDocument = await EmpDocument.findOneAndUpdate(
//           { _id: empDocs._id },
//           { $set: setUpdateData },
//           { new: true, upsert: true }
//         );
//       } else {
//         empDocument = new EmpDocument({
//           empid: empId,
//           secondary_passing,
//           senior_passing,
//           bachelor_passing,
//           undergraduate_passing,
//           ...dataFiles,
//           extra
//         });
//         await empDocument.save();
//       }

//       return res.status(201).json({
//         data: { ...empDocument._doc, documents: [setUpdateData] },
//         message: "Employee document uploaded successfully"
//       });
//     } catch (error) {
//       console.error("Internal server error", error);
//       return res.status(500).json({
//         message: "Internal server error"
//       });
//     }
//   });
// };


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
      
      if (Object.keys(dataFiles).length > 0 || Object.values(experienceData).some(val => val)) {
        setUpdateData.experienceData = experienceData;
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

module.exports.EmployeeRegister = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      throw new Error("Request body is not defined");
    }
      const {
        firstname,
        middlename,
        lastname,
        company_email,
        documentDob,
        mobile_number
       
      } = req.body;

      const exist = await Employee.findOne({
        company_email: req.body.company_email
      });
      if (exist) {
        return res.status(409).json({
          message: "Email Already Exist"
        });
      } 

      // function isCompanyEmail(email) {
      //   const allowedDomains = ["singhsoft.com", "infovices.com", "singhtek.com"];
      //   const domain = email.split("@").pop();
      //   return allowedDomains.includes(domain);
      // }

      if (!firstname) {
        return res.status(400).json({ message: "Please fill firstname" });
      } 
      else if (!mobile_number) {
        return res.status(400).json({ message: "Please fill mobile number" });
      } 
       else if (!company_email) {
        return res.status(400).json({ message: "Please fill role name" });
      }
      else if (!documentDob) {
        return res.status(400).json({ message: "Please fill date" });
      }   
      // else if (!isCompanyEmail(company_email)) {
      //  return res.status(400).json({message : "Please enter a valid email domain (e.g., @singhsoft.com)"});
      // }

     // Generate employee ID based on DOB and mobile number
    //  const year = documentDob.slice(0, 2);
    //  const mobileLast4 = mobile_number.slice(-4);
    //  const base_empId = `${year}${mobileLast4}`;
    //  let employeeID = base_empId;
    //  let numCount = 1;

    //  while (await Employee.findOne({ employeeID })) {
    //    employeeID = `${base_empId}${numCount++}`;
    //  }

    let base_empId = "STEK";
    let numCount = 155;
   let employeeID = `${base_empId}${String(numCount).padStart(4, "0")}`;

  while (await Employee.findOne({ employeeID })) {
    numCount++;
    employeeID = `${base_empId}${String(numCount).padStart(4, "0")}`;
  }


     const capitalize = (string) => (string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : "");

      const capFirstName = capitalize(firstname);
      const capMiddleName = capitalize(middlename);
      const capLastName = capitalize(lastname);
    
      const salt = await bcrypt.genSalt(10);
      const password = "123456"
      const hashPassword = await bcrypt.hash(password, salt);

      const employeename = [capFirstName, capMiddleName, capLastName]
       .filter(name => name && name.trim() !== "") 
       .join(" "); 

  
       const data = [{
         employeename : employeename,
         SerialNumber : "TDBD241100590",
         EmployeeCode : employeeID,
         UserName : "hrmsapi",
         UserPassword : "Hrms@123"
        },
      {
        employeename : employeename,
        SerialNumber : "TDBD241100946",
        EmployeeCode : employeeID,
        UserName : "hrmsapi",
        UserPassword : "Hrms@123"
       }
    ]
  
      const employee = new Employee({
        employeeID,  
        firstname : capFirstName,
        lastname : capLastName,
        middlename :capMiddleName || "",
        mobile_number,
        company_email : company_email.trim(),
        documentDob,
        password: hashPassword,
      });

      await employee.save();

      const emailHtml = `your company email is: ${company_email} <br/> and Password is: ${password}`;
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: employee.company_email,
        subject: "HR-TOOLS - Email",
        html: emailHtml
      });

      addEmployees(data);

      return res.status(201).json({
        message: "Employee create successfully"
      });
  
    } catch (error) {
      return res.status(500).json({ message: "internal server error", error : error.message });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        message : "Internal server error",
        error : error.message
      }
    );
  }
};




















