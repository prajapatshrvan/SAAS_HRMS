const Document = require("../models/Document.model.js");
const Logo = require("../models/Logo.model");
const DocumnetAddress = require("../models/documentAddress.model");
const HeaderFooter = require("../models/header.footer.model.js");
const Content = require("../models/docContent.model");
const Employee = require("../models/Employee.model.js");
const puppeteer = require("puppeteer");
const logger = require("../helpers/logger.js");

module.exports.findEmpByEmail = async (req, res) => {
  try {
    const { company_email } = req.query;
    if (!company_email) {
      return res.status(400).json({ message: "Company email parameter is required" });
    }

    const employee = await Employee.findOne({ company_email }).select(
      "employeeID email firstname lastname mobile_number department designation joining_date createdAt"
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee Not Found" });
    }

    return res.status(200).send(employee);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.createDocument = async (req, res) => {
  try {
    const { empid, remark, document } = req.body;
    if (!document || document.length == 0) {
      return res.status(400).json({
        message: "Invalid Document"
      });
    }

    const existingDocument = await Document.find({ empId: empid });

    if (existingDocument.length !== 0) {
      const foundDocument = existingDocument.find((doc) => doc.document === document);

      if (foundDocument) {
        return res.status(409).json({
          message: "Document already exists for the provided empId"
        });
      }
    }

    const newDocument = new Document({
      empId: empid,
      remark: remark !== undefined ? remark : "",
      document: document
    });
    await newDocument.save();

    res.status(200).send({ message: "success", document: newDocument });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.approvedStatus = async (req, res) => {
  try {
    const { id } = req.body;
    const status = "approved";

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (document.document_status === status) {
      return res.status(400).json({ message: "Document is already approved." });
    }

    const updatedDocument = await Document.findByIdAndUpdate({ _id: id }, { $set: { document_status: status } });

    if (!updatedDocument) {
      return res.status(500).json({ message: "Failed to update document status." });
    }

    return res.status(200).json({ message: "Document status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// module.exports.List = async (req, res) => {
//   try {
//     const approvedDocuments = await Document.find({}).populate({
//       path: "empId",
//       select: "firstname middlename lastname employeeID company_email department designation"
//     });
//     const newData = [];
//     for (let index = 0; index < approvedDocuments.length; index++) {
//       const element = { ...approvedDocuments[index]?._doc };
//       if (element.empId) {
//         element.employeename = element.empId.firstname + " " + element.empId.lastname;
//         element.company_email = element.empId.company_email;
//         element.department = element.empId.department;
//         element.designation = element.empId.designation;
//         element.employeeID = element.empId.employeeID;
//         element.empid = element.empId;
//       }
//       delete element.empId;
//       newData.push(element);
//     }

//     return res.status(200).json({
//       approvedDocuments: newData
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal Server Error"
//     });
//   }
// };

module.exports.List = async (req, res) => {
  try {
  
    const searchQuery = req.query.search || ''; 

    
    const regex = new RegExp(`^${searchQuery}`, 'i'); 
   
    const filter = (req.user.role_name === "HR" || req.user.role_name === "ADMIN") 
      ? {}  
      : { empId: req.user.userObjectId };  

    let approvedDocuments;
    if (searchQuery) {
      
      approvedDocuments = await Document.find(filter)
        .populate({
          path: "empId",
          select: "firstname middlename lastname employeeID company_email department designation"
        })
        .where('empId.firstname') 
        .regex(regex) 
        .or([{ 'empId.lastname': { $regex: regex } }]); 
    } else {
      approvedDocuments = await Document.find(filter)
        .populate({
          path: "empId",
          select: "firstname middlename lastname employeeID company_email department designation"
        });
    }

    // Transform data
    const newData = approvedDocuments.map(doc => {
      const element = { ...doc._doc };
      if (element.empId) {
        element.employeename = `${element.empId.firstname} ${element.empId.lastname}`;
        element.company_email = element.empId.company_email;
        element.department = element.empId.department;
        element.designation = element.empId.designation;
        element.employeeID = element.empId.employeeID;
        element.empid = element.empId;
      }
      delete element.empId;
      return element;
    });

    return res.status(200).json({
      approvedDocuments: newData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};


module.exports.viewDocument = async (req, res) => {
  try {
    const { id, document } = req.params;
    // const employee = await Employee.findOne({}).select("firstname lastname email");
    // const logo = await Logo.findOne({}).select("logo_image");
    const headerfooter = await HeaderFooter.findOne({}).select("header_image footer_image");
    const address = await DocumnetAddress.findOne({}).select("line1 line2 line3 country state city zip");
    const content = await Content.findOne({ subject: document }).select("subject content");
    const documents = await Document.findOne({ empId: id, document: document }).populate("empId");

    const generateLetter = (headerfooterData, addressData, contentData, documentData) => {
      const currentDate = new Date().toLocaleDateString();
      let subject = "";
      let content = "";
      let empFirstName = "";
      let empMiddleName = "";
      let empLastName = "";
      let remark = "";
      let fullName = "";

      if (contentData) {
        subject = contentData.subject || "";
        content = contentData.content || "";
      }
      if (documentData) {
        empFirstName = documentData?.empId ? documentData?.empId?.firstname : " ";
        empMiddleName = documentData?.empId ? documentData?.empId?.middlename : " ";
        empLastName = documentData?.empId ? documentData?.empId?.lastname : " ";
        fullName = [empFirstName, empMiddleName, empLastName].filter(Boolean).join(" ");
        remark = documentData.remark || "";
      }
      return `
   <html>
<head>
    <style>
        
        .mainHeader{
          width: 100%;
         justify-content: center;
        }
        .secHeader{
          width: 10%;
          display: flex;
         justify-content: end;
        }
        .header_2{
         width: 100%;
         height: 30px;
         background-color:#F37052;
        }
        .triangle {
        width: 0;
        height: 0px;
        border-left: 120px solid transparent;
        border-right: 0px solid transparent;
        border-top: 130px solid #F37052;
        position: absolute;
        }
       
        .address {
            padding-right: 105px;
          }
        .bold {
          font-weight: 900;
          font-size: 1.2em;
          padding-left:20px;
        }
        .content {
          font-size: 1.2em;
          padding-left:20px;
           line-height: 1.5;
        }
        .mainContent{
          padding: 20px;
         
          position:relative
        }
          .subject {
          text-align: center;
          font-weight: 900;
          font-size: 1.2em;
          padding-left: 20px;
          margin-bottom:40px
        }
          .body{
          position:relative}
          
          .img{
         position:absolute;
         bottom:0
       }

       .date{
          font-weight: 900;
          font-size: 1.2em;
          padding-left:20px;
          margin: 50px 0px;
       }
      </style>
</head>
<body class="body">
    <div class="container">
    <div class="header" >
    </div>
  

    <div class="mainHeader">
      <div class="logo">
        <img src="${process.env.HOST}/${
        headerfooterData ? headerfooterData.header_image : " "
      }" width="100%" alt="Logo">
        
        </div>
    </div>

       </div>
     </div>
    </div>
    <div class="mainContent">
     <p class="date"><b>Date: ${currentDate}</b></p>
     <p class = "subject">${subject}</p>
     <p class="bold">Dear ${fullName},</p>
     <p class="content">${content}</p>
     <p class="bold">Remark : ${remark}</p> <!-- Use remark variable -->
     <p class="bold">Sincerely,</p>

     <p class="bold">Dear ${fullName},</p>
     <p class ="bold">[Singhtek BizGroup Pvt Ltd]<p>

     </div>
</body>
</html>
  `;
    };

    const formattedLetter = generateLetter(headerfooter, address, content, documents);

    return res.status(200).send(formattedLetter);
  } catch (error) {
    console.log(error);
    logger.error("An error occurred", error);
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

<head>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      position: relative;
      min-height: 100vh; /* Ensure body takes full height */
      padding-bottom: 80px; /* Add space for footer */
    }

    .mainHeader {
      width: 100%;
      height: 200px; /* Adjust height as needed */
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px; /* Space below header */
    }

    .logo img {
      width: 1020px; /* Ensure the logo fits within the header */
      height: auto; /* Maintain aspect ratio */
    }

    .mainContent {
      padding: 20px;
    
      margin-bottom: 60px; /* Space for footer */
    }

    .subject {
      text-align: center;
      font-weight: bold;
      font-size: 1.7em;
      margin: 20px 0;
    }

    .date,
    .bold {
      font-weight: bold;
      font-size: 1.5em;
      margin: 20px 0;
    }

    .content {
      font-size: 1.5em;
      line-height: 1.5;
      margin: 10px 0;
        display: flex;
       justify-content: center;
    }

    .footer {
      width: 100%;
      height: 50px; /* Adjust height as needed */
      text-align: center;
      position: absolute; /* Position footer at the bottom */
      bottom: 20px; /* Adjust to create space above footer */
      left: 0; /* Align footer to the left */
    }

    .footer img {
      width: 100%; /* Make sure footer image is responsive */
      height: auto;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="mainHeader">
      <div class="logo">
        <img src="${process.env.HOST}/${headerfooterData?.header_image}" alt="Logo">
      </div>
    </div>

    <div class="mainContent">
      <p class="date">Date: ${currentDate}</p>
      <p class="subject">${subject}</p>
      <p class="bold">Dear ${empFullName},</p>
      <p class="content">${finalContent}</p>
      <p class="bold">Sincerely,</p>
      <p class="bold">${empFullName}</p>
      <p class="bold">[Singhtek BizGroup Pvt Ltd]</p>
      
    </div>

   
  </div>
</body>

</html>

      `;
    };

    const formattedLetter = generateLetter(headerfooter, address, content, documents);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();
    await page.setContent(formattedLetter);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "60px", left: "10mm", right: "10mm" },
      scale: 0.75
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="generated_letter.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error generating document for ID: ${req.params.id} and document: ${req.params.document}`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
