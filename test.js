// module.exports.EmployeeAdd = async (req, res, next) => {
//   upload(req, res, async (err) => {
//     try {
//       const {
//         firstname,
//         middlename,
//         lastname,
//         documentDob,
//         originalDob,
//         gender,
//         email,
//         mobile_number,
//         emergency_number,
//         aadharcard_no,
//         pancard_no,
//         family_member_first_name,
//         family_member_last_name,
//         relationship,
//         family_member_dob,
//         family_member_phone,
//         family_member_email
//       } = req.body;

//       const capitalizeFirstLetter = (string) => {
//         return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
//       };

//       const capFirstName = capitalizeFirstLetter(firstname);
//       const capMiddleName = middlename ? capitalizeFirstLetter(middlename) : "";
//       const capLastName = capitalizeFirstLetter(lastname);
//       const capGender = capitalizeFirstLetter(gender);
//       const capFamilyMemberFirstName = capitalizeFirstLetter(family_member_first_name);
//       const capFamilyMemberLastName = capitalizeFirstLetter(family_member_last_name);

//       let errors = {};

//       if (!Validation.name_regex.test(firstname)) {
//         errors = "Please fill up valid firstname";
//       }
//       if (!Validation.name_regex.test(lastname)) {
//         errors = "Please fill up valid lastname";
//       }
//       if (!Validation.email_regex.test(email)) {
//         errors = "Please fill up valid email";
//       }
//       if (!Validation.mobile_regex.test(mobile_number)) {
//         errors = "Please fill up valid mobile number";
//       }
//       if (!Validation.mobile_regex.test(emergency_number)) {
//         errors = "Please fill up valid emergency mobile number";
//       }
//       if (!Validation.aadhar_Regex.test(aadharcard_no)) {
//         errors = "Please fill up valid aadhar card number";
//       }
//       if (!Validation.pan_Regex.test(pancard_no.toUpperCase())) {
//         errors = "Please fill up valid pan card number";
//       }

//       if (Object.keys(errors).length) {
//         logger.error(errors);
//         return res.status(400).json({ errors: errors });
//       }

//       // if (!image) {
//       //   return res.status(400).json({ message: "Profile image is required" });
//       // }

//       // Check for existing records
//       const existEmail = await Employee.findOne({ email });
//       if (existEmail) {
//         return res.status(409).json({ message: "Email already exists" });
//       }

//       const existAadharcard = await Employee.findOne({ aadharcard_no });

//       if (existAadharcard) {
//         return res.status(409).json({ message: "Aadhar card number already exists" });
//       }

//       const existpancard = await Employee.findOne({ pancard_no });
//       if (existpancard) {
//         return res.status(409).json({ message: "PAN card number already exists" });
//       }
//       if (mobile_number === emergency_number) {
//         errors.emergency_number = "Emergency number cannot be the same as the mobile number";
//       }

//       // Generate employee ID
//       const year = documentDob.slice(0, 2);
//       const mobileLast4 = mobile_number.slice(-4);
//       const base_empId = year + mobileLast4;
//       let employeeID = base_empId;

//       // const base_empId = lastname.slice(0, 3) + firstname.slice(0, 3);
//       // let employeeID = base_empId.toLowerCase();
//       let numCount = 1;
//       let existingEmp;
//       do {
//         existingEmp = await Employee.findOne({ employeeID });
//         if (existingEmp) {
//           // employeeID = base_empId.toLowerCase() + numCount;
//           employeeID = base_empId + numCount;
//           numCount++;
//         }
//       } while (existingEmp);

//       // Create employee object
//       const employee = new Employee({
//         employeeID,
//         firstname: capFirstName,
//         middlename: capMiddleName,
//         lastname: capLastName,
//         // image: `uploads/${employeeID}/${req.files.image[0].filename}`,
//         image: req.files?.image ? `uploads/${employeeID}/${req.files.image[0].filename}` : null,
//         documentDob,
//         originalDob,
//         gender: capGender,
//         email: email.toLowerCase(),
//         mobile_number,
//         emergency_number,
//         aadharcard_no,
//         aadhar_image: `uploads/${employeeID}/${req.files.aadhar_image[0].filename}`,
//         pancard_no: pancard_no.toUpperCase(),
//         pan_image: `uploads/${employeeID}/${req.files.pan_image[0].filename}`,
//         family_member_first_name: capFamilyMemberFirstName,
//         family_member_last_name: capFamilyMemberLastName,
//         relationship,
//         family_member_dob,
//         family_member_phone,
//         family_member_email
//       });

//       // Save employee record
//       let data = await employee.save();
//       return res.status(201).json({ data: data, message: "Employee details added successfully" });
//     } catch (error) {
//       console.error("Error in adding employee details:", error);
//       return res.status(500).json({ message: "Internal server error.", error: error });
//     }
//   });
// };

// const express = require("express");
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Sample designation data
// const designations = {
//   sales: [
//     "Sales Executive/Representative",
//     "Sales Coordinator",
//     "Account Manager",
//     "Business Development Executive/Manager",
//     "Sales Manager",
//     "Regional Sales Manager",
//     "Sales Director",
//     "Chief Sales Officer (CSO)"
//   ],
//   it: [
//     "IT Support Technician",
//     "Network Administrator",
//     "System Administrator",
//     "Software Developer/Engineer",
//     "Database Administrator (DBA)",
//     "IT Project Manager",
//     "Information Security Analyst",
//     "DevOps Engineer",
//     "Cloud Architect",
//     "Chief Technology Officer (CTO)"
//   ],
//   recruitment: [
//     "HR Assistant/Coordinator",
//     "Recruiter/Talent Acquisition Specialist",
//     "HR Generalist",
//     "Recruitment Manager",
//     "HR Manager",
//     "Employee Relations Specialist",
//     "Training and Development Manager",
//     "Chief Human Resources Officer (CHRO)"
//   ],
//   accounts: [
//     "Accounts Assistant/Clerk",
//     "Accountant",
//     "Payroll Specialist",
//     "Financial Analyst",
//     "Accounts Payable/Receivable Specialist",
//     "Tax Specialist/Tax Accountant",
//     "Audit Manager",
//     "Finance Manager",
//     "Chief Financial Officer (CFO)"
//   ]
// };

// // API routes to get designations by department

// // Get all designations for Sales department
// app.get("/api/designations/sales", (req, res) => {
//   res.status(200).json({
//     department: "Sales",
//     designations: designations.sales
//   });
// });

// // Get all designations for IT department
// app.get("/api/designations/it", (req, res) => {
//   res.status(200).json({
//     department: "IT",
//     designations: designations.it
//   });
// });

// // Get all designations for Recruitment department
// app.get("/api/designations/recruitment", (req, res) => {
//   res.status(200).json({
//     department: "Recruitment",
//     designations: designations.recruitment
//   });
// });

// // Get all designations for Accounts department
// app.get("/api/designations/accounts", (req, res) => {
//   res.status(200).json({
//     department: "Accounts",
//     designations: designations.accounts
//   });
// });

// // Home route
// app.get("/", (req, res) => {
//   res.send("Welcome to the Company Designations API");
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports.generateDocument = async (req, res) => {
  try {
    const { id, document } = req.params;

    // Use Promise.all to run multiple asynchronous queries concurrently
    const [headerfooter, address, content, documents] = await Promise.all([
      HeaderFooter.findOne({}).select("header_image footer_image"),
      DocumnetAddress.findOne({}).select("line1 line2 line3 country state city zip"),
      Content.findOne({ subject: document }).select("subject content"),
      Document.findOne({ empId: id, document: document }).populate("empId")
    ]);

    // Function to generate the HTML letter
    const generateLetter = (headerfooterData, addressData, contentData, documentData) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      const currentDate = new Date().toLocaleDateString("en-GB", options);

      // Destructure and sanitize content data
      const subject = contentData?.subject || "";
      const content = contentData?.content || "";
      const empFirstName = documentData?.empId?.firstname || "";
      const empMiddleName = documentData?.empId?.middlename || "";
      const empLastName = documentData?.empId?.lastname || "";
      const fullName = [empFirstName, empMiddleName, empLastName].filter(Boolean).join(" ");
      const remark = documentData?.remark || "";

      // Replace the date in the content
      const finalContent = content.replace("May 15, 2025", currentDate);

      return `
      <html>
      <head>
          <style>
              .mainHeader { width: 100%; justify-content: center; }
              .secHeader { width: 10%; display: flex; justify-content: end; }
              .header_2 { width: 100%; height: 30px; background-color: #F37052; }
              .triangle { width: 0; height: 0px; border-left: 120px solid transparent; border-top: 130px solid #F37052; position: absolute; }
              .address { padding-right: 105px; }
              .bold { font-weight: 900; font-size: 1.2em; padding-left: 20px; }
              .content { font-size: 1.2em; padding-left: 20px; line-height: 1.5; }
              .mainContent { padding: 20px; position: relative; }
              .subject { text-align: center; font-weight: 900; font-size: 1.2em; padding-left: 20px; margin-bottom: 40px; }
              .body { position: relative; }
              .img { position: absolute; bottom: 0; }
              .date { font-weight: 900; font-size: 1.2em; padding-left: 20px; margin: 30px 0px; }
          </style>
      </head>
      <body class="body">
          <div class="container">
              <div class="mainHeader">
                  <div class="logo">
                      <img src="${process.env.HOST}/${headerfooterData?.header_image}" width="100%" alt="Logo">
                  </div>
              </div>
          </div>
          <div class="mainContent">
              <p class="date"><b>Date: ${currentDate}</b></p>
              <p class="subject">${subject}</p>
              <p class="bold">Dear ${fullName},</p>
              <p class="content">${finalContent}</p>
              <p class="bold">Remark: ${remark}</p>
              <p class="bold">Sincerely,</p>
              <p class="bold">${fullName}</p>
              <p class="bold">[Singhtek BizGroup Pvt Ltd]</p>
          </div>
          <img src="${process.env.HOST}/${headerfooterData?.footer_image}" width="100%" alt="Logo" class="img">
      </body>
      </html>
      `;
    };

    const formattedLetter = generateLetter(headerfooter, address, content, documents);

    // Launch Puppeteer with options to handle environments that run as root (like Docker)
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(formattedLetter);

    // PDF generation
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();

    // Send PDF to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="generated_letter.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    // Log the error with more details
    logger.error(`Error generating document for ID: ${req.params.id} and document: ${req.params.document}`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.generateDocument = async (req, res) => {
  try {
    const { id, document } = req.params;

    const [headerfooter, address, content, documents] = await Promise.all([
      HeaderFooter.findOne({}).select("header_image footer_image"),
      DocumnetAddress.findOne({}).select("line1 line2 line3 country state city zip"),
      Content.findOne({ subject: document }).select("subject content"),
      Document.findOne({ empId: id, document }).populate("empId")
    ]);

    const generateLetter = (headerfooterData, addressData, contentData, documentData) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      const currentDate = new Date().toLocaleDateString("en-GB", options);
      const subject = contentData?.subject || "";
      const empFullName = [
        documentData?.empId?.firstname,
        documentData?.empId?.middlename,
        documentData?.empId?.lastname
      ]
        .filter(Boolean)
        .join(" ");
      const finalContent = contentData?.content.replace("May 15, 2025", currentDate) || "";

      return `
        <html>
          <head>...</head>
          <body>
            <p>Date: ${currentDate}</p>
            <p>Dear ${empFullName},</p>
            <p>${finalContent}</p>
            <p>Remark: ${documentData?.remark || ""}</p>
            <p>Sincerely, ${empFullName}</p>
          </body>
        </html>
      `;
    };

    const formattedLetter = generateLetter(headerfooter, address, content, documents);

    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(formattedLetter);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="generated_letter.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error generating document for ID: ${id} and document: ${document}`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// module.exports.generateDocument = async (req, res) => {
//   try {
//     const { id, document } = req.params;
//     // const employee = await Employee.findOne({}).select("firstname lastname email");
//     // const logo = await Logo.findOne({}).select("logo_image");
//     const headerfooter = await HeaderFooter.findOne({}).select("header_image footer_image");
//     const address = await DocumnetAddress.findOne({}).select("line1 line2 line3 country state city zip");
//     const content = await Content.findOne({ subject: document }).select("subject content");
//     const documents = await Document.findOne({ empId: id, document: document }).populate("empId");

//     const generateLetter = (headerfooterData, addressData, contentData, documentData) => {
//       const options = { day: "2-digit", month: "2-digit", year: "numeric" };
//       const currentDate = new Date().toLocaleDateString("en-GB", options);
//       let subject = "";
//       let content = "";
//       let empFirstName = "";
//       let empMiddleName = "";
//       let empLastName = "";
//       let remark = "";
//       let fullName = "";

//       if (contentData) {
//         subject = contentData.subject || "";
//         content = contentData.content || "";
//       }
//       if (documentData) {
//         empFirstName = documentData?.empId ? documentData?.empId?.firstname : " ";
//         empMiddleName = documentData?.empId ? documentData?.empId?.middlename : " ";
//         empLastName = documentData?.empId ? documentData?.empId?.lastname : " ";
//         fullName = [empFirstName, empMiddleName, empLastName].filter(Boolean).join(" ");
//         remark = documentData.remark || "";
//       }

//       const content1 = content.replace("May 15, 2025", currentDate);

//       return `
//    <html>
// <head>
//     <style>

//         .mainHeader{
//           width: 100%;
//          justify-content: center;
//         }
//         .secHeader{
//           width: 10%;
//           display: flex;
//          justify-content: end;
//         }
//         .header_2{
//          width: 100%;
//          height: 30px;
//          background-color:#F37052;
//         }
//         .triangle {
//         width: 0;
//         height: 0px;
//         border-left: 120px solid transparent;
//         border-right: 0px solid transparent;
//         border-top: 130px solid #F37052;
//         position: absolute;
//         }

//         .address {
//             padding-right: 105px;
//           }
//         .bold {
//           font-weight: 900;
//           font-size: 1.2em;
//           padding-left:20px;
//         }
//         .content {
//           font-size: 1.2em;
//           padding-left:20px;
//            line-height: 1.5;
//         }
//         .mainContent{
//           padding: 20px;

//           position:relative
//         }
//           .subject {
//           text-align: center;
//           font-weight: 900;
//           font-size: 1.2em;
//           padding-left: 20px;
//           margin-bottom:40px
//         }
//           .body{
//           position:relative}

//           .img{
//          position:absolute;
//          bottom:0
//        }

//        .date{
//           font-weight: 900;
//           font-size: 1.2em;
//           padding-left:20px;
//           margin: 30px 0px;
//        }
//       </style>
// </head>
// <body class="body">
//     <div class="container">
//     <div class="header" >
//     </div>

//     <div class="mainHeader">
//       <div class="logo">
//         <img src="${process.env.HOST}/${headerfooterData.header_image}" width="100%" alt="Logo">
//         </div>
//     </div>

//        </div>
//      </div>
//     </div>
//     <div class="mainContent">
//      <p class="date"><b>Date: ${currentDate}</b></p>
//      <p class = "subject">${subject}</p>
//      <p class="bold">Dear ${fullName},</p>
//      <p class="content">${content}</p>
//      <p class="bold">Remark : ${remark}</p> <!-- Use remark variable -->
//      <p class="bold">Sincerely,</p>

//      <p class="bold">${fullName},</p>
//      <p class ="bold">[Singhtek BizGroup Pvt Ltd]<p>

//      </div>
//      <img src="${process.env.HOST}/${headerfooterData.footer_image}" width="100%" alt="Logo" class="img" >
// </body>
// </html>
//   `;
//     };

//     const formattedLetter = generateLetter(headerfooter, address, content, documents);

//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.setContent(formattedLetter);
//     const pdfBuffer = await page.pdf({ format: "A4" });

//     await browser.close();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", 'attachment; filename="generated_letter.pdf"');
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.log(error);
//     logger.error("An error occurred", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

module.exports.createLeave = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Upload Error:", err);
        return res.status(400).json({ error: "File upload failed", err });
      }

      const { type, start_date, end_date, reason, session, requestto } = req.body;

      // Parse dates from DD/MM/YYYY format to the correct format
      const parseDate = (dateStr) => {
        const parts = dateStr.split("/");
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      };

      const sdate = parseDate(start_date);
      const edate = parseDate(end_date);

      // Check for valid date range
      if (!sdate || !edate || isNaN(sdate) || isNaN(edate) || edate < sdate) {
        return res.status(400).json({ message: "Invalid start or end date" });
      }

      const existingLeave = await Leave.findOne({
        empid: req.user.userObjectId,
        $or: [
          { start_date: { $lte: edate }, end_date: { $gte: sdate } },
          { start_date: { $eq: sdate }, end_date: { $eq: edate } }
        ]
      });

      if (existingLeave && (existingLeave.status === "approved" || existingLeave.status === "pending")) {
        return res.status(400).json({ message: "You have already applied for leave during this period" });
      }

      // Validate the reason length
      const wordCount = reason.trim().split(/\s+/).length;
      if (wordCount > 20) {
        return res.status(400).json({ message: "Reason must be 20 words or fewer" });
      }

      // Calculate leave days
      let leave_days = Math.round((edate - sdate) / (1000 * 3600 * 24)) + 1;

      // Ensure that start date is not older than 30 days
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 30);
      if (sdate < currentDate) {
        return res.status(400).json({ message: "Start date should not be older than 30 days from today." });
      }

      if (!type || !type.trim() || !reason.trim()) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      if (sdate.toDateString() === edate.toDateString() && (session === "Session 1" || session === "Session 2")) {
        leave_days = 0.5;
      }

      const emp = await Employee.findOne({ _id: req.user.userObjectId });
      if (!emp) {
        return res.status(400).json({ message: "Employee not found" });
      }

      const leave = await Leave.create({
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

      return res.status(200).json({ message: "Leave created successfully" });
    } catch (error) {
      console.error("Internal Server Error:", error);
      return res.status(500).json({
        error: error.message || "Internal server error"
      });
    }
  });
};

// const checkLeaves = (attendance, leaves) => {
//   let newData = attendance.map((item) => {
//     let newItem = { ...item };
//     delete newItem.__v;
//     let date = new Date(new Date(item.date).toDateString());
//     let leaveFound = false;

//     for (let i = 0; i < leaves.length; i++) {
//       let leave = leaves[i];
//       let startDate = new Date(new Date(leave.start_date).toDateString());
//       let endDate = new Date(new Date(leave.end_date).toDateString());

//       if (startDate <= date && endDate >= date) {
//         leaveFound = true;

//         if (leave.status === "cancelled" && item.status == true) {
//           newItem.leave_type = "P";
//           newItem.color = "30991F";
//         } else if (leave.status === "cancelled" && item.status == false) {
//           newItem.leave_type = "A";
//           newItem.color = "FF0606";
//         } else if (leave.status === "approved" && leave.session === "Session 2") {
//           newItem.leave_type = "HD";
//           newItem.color = "FFA800";
//         } else if (leave.status === "approved" && leave.session === "Session 1") {
//           newItem.leave_type = "HD";
//           newItem.color = "FFA800";
//         } else if (leave.status === "approved") {
//           newItem.leave_type = "L";
//           newItem.color = "0F137E";
//         }
//         break;
//       }
//     }

//     if (!leaveFound) {
//       newItem.leave_type = item.status ? "P" : "A";
//       newItem.color = item.status ? "30991F" : "FF0606";
//     }

//     return newItem;
//   });

//   return newData;
// };

// const checkLeaves = (attendance, leaves) => {
//   let newData = attendance.map((item) => {
//     let newItem = { ...item };
//     delete newItem.__v;
//     let date = new Date(new Date(item.date).toDateString());
//     let leaveFound = false;

//     for (let i = 0; i < leaves.length; i++) {
//       let leave = leaves[i];
//       let startDate = new Date(new Date(leave.start_date).toDateString());
//       let endDate = new Date(new Date(leave.end_date).toDateString());

//       if (startDate <= date && endDate >= date) {
//         leaveFound = true;

//         if (leave.status === "cancelled" && item.status == true) {
//           newItem.leave_type = "P";
//           newItem.color = "30991F";
//         } else if (leave.status === "cancelled" && item.status == false) {
//           newItem.leave_type = "A";
//           newItem.color = "FF0606";
//         } else if (leave.status === "approved" && leave.session === "Session 2") {
//           newItem.leave_type = "HD";
//           newItem.color = "FFA800";
//         } else if (leave.status === "approved" && leave.session === "Session 1") {
//           newItem.leave_type = "HD";
//           newItem.color = "FFA800";
//         } else if (leave.status === "approved") {
//           newItem.leave_type = "L";
//           newItem.color = "0F137E";
//         }
//         break;
//       }
//     }

//     if (!leaveFound) {
//       newItem.leave_type = item.status ? "P" : "A";
//       newItem.color = item.status ? "30991F" : "FF0606";
//     }

//     return newItem;
//   });

//   return newData;
// };

module.exports.generateDocument = async (req, res) => {
  try {
    const { id, document } = req.params;

    // Use Promise.all to run multiple asynchronous queries concurrently
    const [headerfooter, address, content, documents] = await Promise.all([
      HeaderFooter.findOne({}).select("header_image footer_image"),
      DocumnetAddress.findOne({}).select("line1 line2 line3 country state city zip"),
      Content.findOne({ subject: document }).select("subject content"),
      Document.findOne({ empId: id, document: document }).populate("empId")
    ]);

    // Function to generate the HTML letter
    const generateLetter = (headerfooterData, addressData, contentData, documentData) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      const currentDate = new Date().toLocaleDateString("en-GB", options);

      // Destructure and sanitize content data
      const subject = contentData?.subject || "";
      const content = contentData?.content || "";
      const empFirstName = documentData?.empId?.firstname || "";
      const empMiddleName = documentData?.empId?.middlename || "";
      const empLastName = documentData?.empId?.lastname || "";
      const fullName = [empFirstName, empMiddleName, empLastName].filter(Boolean).join(" ");
      const remark = documentData?.remark || "";

      // Replace the date in the content
      const finalContent = content.replace("May 15, 2025", currentDate);

      return `
<html>
<head>
    <style>
        .mainHeader { width: 100%; justify-content: center; }
        .secHeader { width: 10%; display: flex; justify-content: end; }
        .header_2 { width: 100%; height: 30px; background-color: #F37052; }
        .triangle { width: 0; height: 0px; border-left: 120px solid transparent; border-top: 130px solid #F37052; position: absolute; }
        .address { padding-right: 105px; }
        .bold { font-weight: 900; font-size: 1.2em; padding-left: 20px; }
        .content { font-size: 1.2em; padding-left: 20px; line-height: 1.5; }
        .mainContent { padding: 20px; position: relative; }
        .subject { text-align: center; font-weight: 900; font-size: 1.2em; padding-left: 20px; margin-bottom: 40px; }
        .body { position: relative; }
        .img { position: absolute; bottom: 0; }
        .date { font-weight: 900; font-size: 1.2em; padding-left: 20px; margin: 30px 0px; }
    </style>
</head>
<body class="body">
    <div class="container">
        <div class="mainHeader">
            <div class="logo">
                <img src="${process.env.HOST}/${headerfooterData?.header_image}" width="100%" alt="Logo">
            </div>
        </div>
    </div>
    <div class="mainContent">
        <p class="date"><b>Date: ${currentDate}</b></p>
        <p class="subject">${subject}</p>
        <p class="bold">Dear ${fullName},</p>
        <p class="content">${finalContent}</p>
        <p class="bold">Remark: ${remark}</p>
        <p class="bold">Sincerely,</p>
        <p class="bold">${fullName}</p>
        <p class="bold">[Singhtek BizGroup Pvt Ltd]</p>
    </div>
    <img src="${process.env.HOST}/${headerfooterData?.footer_image}" width="100%" alt="Logo" class="img">
</body>
</html>
      `;
    };

    const formattedLetter = generateLetter(headerfooter, address, content, documents);

    // Launch Puppeteer with options to handle environments that run as root (like Docker)
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(formattedLetter);

    // PDF generation
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();

    // Send PDF to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="generated_letter.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    // Log the error with more details
    logger.error(`Error generating document for ID: ${req.params.id} and document: ${req.params.document}`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.addBulkHoliday = async (req, res) => {
  try {
    const { year: requestedYear, country: requestedCountry, state: requestedState, holiday_status, holiday } = req.body;
    if (
      !requestedCountry ||
      !requestedYear ||
      !holiday ||
      !Array.isArray(holiday) ||
      holiday.length < 1 ||
      holiday.some((h) => !h || !h.date)
    ) {
      return res.status(400).json({
        message: "Invalid or incomplete request data. Minimum 1 valid holiday with a date is required."
      });
    }

    const holidayDates = holiday.map((data) => data.date);

    let existingHolidays = await Holiday.findOne({
      country: requestedCountry,
      state: requestedState,
      year: requestedYear
    });

    // Process holidays and add day of the week
    const holidaysWithDay = holiday.map((h) => {
      const validDate = new Date(h.date);
      if (isNaN(validDate.getTime())) {
        return { ...h, date: null, day: "Invalid Date" };
      }

      // Format date as YYYY-MM-DD and get day of the week
      const formattedDate = validDate.toISOString().split("T")[0];
      const dayOfWeek = validDate.toLocaleDateString("en-US", { weekday: "long" });

      return { ...h, date: formattedDate, day: dayOfWeek };
    });

    // Filter valid holidays (ignore invalid ones)
    const validHolidays = holidaysWithDay.filter((h) => h.date !== null);

    if (validHolidays.length === 0) {
      return res.status(400).json({
        message: "No valid holidays provided."
      });
    }

    if (existingHolidays) {
      const existingDates = existingHolidays.holiday.map((h) => h.date);
      const newHolidays = validHolidays.filter((h) => !existingDates.includes(h.date));

      if (newHolidays.length === 0) {
        return res.status(409).json({
          message: "This holidays already exist."
        });
      }

      existingHolidays.holiday.push(...newHolidays);

      // Save the updated holidays
      await existingHolidays.save();
    } else {
      // Create a new holiday document if no holidays exist for the given year, country, and state
      const newHoliday = new Holiday({
        country: requestedCountry,
        state: requestedState,
        year: requestedYear,
        holiday_status,
        holiday: validHolidays
      });

      await newHoliday.save();
    }

    return res.status(200).json({
      message: "Holidays added successfully."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

const holidaySchema = new mongoose.Schema({
  country: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  holiday_status: {
    type: String,
    default: "pending"
  },
  holiday: [
    {
      holiday_name: {
        type: String,
        required: true
      },
      date: {
        type: String,
        required: true
      },
      day: {
        type: String,
        required: true
      },
      _id: false
    }
  ]
});
const Holiday = mongoose.model("Holiday", holidaySchema);

module.exports = Holiday;

module.exports.addBulkHoliday = async (req, res) => {
  try {
    const requestedYear = req.body.year;
    const requestedCountry = req.body.country;
    const requestedState = req.body.state;
    const { holiday_status, holiday } = req.body;

    if (
      !requestedCountry ||
      !requestedYear ||
      !holiday ||
      !Array.isArray(holiday) ||
      holiday.length < 1 ||
      holiday.some((h) => h === null || h.date === null)
    ) {
      return res.status(400).json({
        message: "Invalid or incomplete request data. Minimum 1 valid dates required."
      });
    }
    let date = [];
    holiday.map((data) => {
      date.push(data.date);
    });

    const existingHolidays = await Holiday.findOne({
      country: requestedCountry,
      state: requestedState,
      year: requestedYear,
      "holiday.date": { $in: date }
    });

    if (existingHolidays) {
    }

    // if (existingHolidays) {
    //   return res.status(409).json({
    //     message: "Holidays already exists"
    //   });
    // }

    const holidaysWithDay = holiday.map((h) => {
      const [year, month, day] = h.date.split("-");
      const isValidDate = !isNaN(year) && !isNaN(month) && !isNaN(day);

      if (!isValidDate) {
        return { ...h, date: null, day: "Invalid Date" };
      }

      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      const dayOfWeek = new Date(`${formattedDate}`).toLocaleDateString("en-US", { weekday: "long" });

      return { ...h, date: formattedDate, day: dayOfWeek };
    });

    const validHolidays = holidaysWithDay.filter((h) => h.date !== null);

    if (validHolidays.length === 0) {
      return res.status(400).json({
        message: "No valid dates provided"
      });
    }

    const newHoliday = new Holiday({
      country: requestedCountry,
      state: requestedState,
      year: requestedYear,
      holiday_status,
      holiday: validHolidays
    });

    await newHoliday.save();

    return res.status(200).json({
      message: "Holidays created successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

// module.exports.HolidayList = async (req, res) => {
//   try {
//     const { holiday_status, year, country, state } = req.query;
//     const currentYear = moment().format("YYYY");
//     const defaultYear = year || currentYear;
//     const defaultCountry = country || "India";
//     const defaultState = state || "Rajasthan";

//     const query = {
//       country: defaultCountry,
//       state: defaultState,
//       year: defaultYear
//     };

//     if (holiday_status) {
//       query.holiday_status = "approved";
//     }
//     const holidaylist = await Holiday.find(query, { country: 0, year: 0, state: 0, holiday_status: 0 });

//     const formattedHolidaylist = {};
//     holidaylist.forEach((holiday) => {
//       holiday.holiday.forEach((h) => {
//         const dayOfday = moment(h.date).format("DD");
//         const dayOfMonth = moment(h.date).format("MM");

//         if (!formattedHolidaylist[dayOfMonth]) {
//           formattedHolidaylist[dayOfMonth] = [];
//         }

//         formattedHolidaylist[dayOfMonth].push({
//           holiday_name: h.holiday_name,
//           date: dayOfday,
//           day: h.day
//         });
//       });
//     });

//     console.log(formattedHolidaylist);

//     return res.status(200).json({
//       holidaylist: [formattedHolidaylist]
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal Server Error"
//     });
//   }
// };
