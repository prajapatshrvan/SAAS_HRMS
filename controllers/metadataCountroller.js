const metaData = require("../models/metadata.model");

const designations = {
  sales: [
    "Sales Executive/Representative",
    "Sales Coordinator",
    "Account Manager",
    "Business Development Executive/Manager",
    "Sales Manager",
    "Regional Sales Manager",
    "Sales Director",
    "Chief Sales Officer"
  ],
  admin: ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "MANAGER"],
  it: [
    "NodeJs Developer",
    "ReactJS Developer",
    "Angular Developer",
    "Vue.js Developer",
    "Full Stack Developer",
    "MERN Stack Developer",
    "MIN Stack Developer",
    "Software Manual Tester",
    "Quality Analyst(QA)",
    "Flutter Developer",
    "IOS Developer",
    "Android Developer",
    "Graphic Designer",
    "Frontend developer",
    "Designer",
    "UI Designer",
    "UX Designer",
    "UI/UX Designer",
    "UI Developer",
    "DevOps Developer",
    "Rust Developer",
    "Java Developer",
    "C/C++ Developer",
    ".NET Developer",
    "Ruby Developer",
    "Python Developer",
    "PHP Developer",
    "Game Developer",
    "JavaScript Developer",
    "Cloud Architect",
    "Database Administrator",
    "Project Manager",
    "Blockchain Developer",
    "SEO Specialist",
    "SEO Manager"
  ],
  recruitment: [
    "HR Assistant/Coordinator",
    "Recruiter/Talent Acquisition Specialist",
    "HR Generalist",
    "Recruitment Manager",
    "HR Manager",
    "Employee Relations Specialist",
    "Training and Development Manager",
    "Chief Human Resources Officer"
  ],
  accounts: [
    "Accounts Assistant",
    "Accountant",
    "Payroll Specialist",
    "Financial Analyst",
    "Accounts Payable/Receivable Specialist",
    "Tax Specialist/Tax Accountant",
    "Audit Manager",
    "Finance Manager",
    "Chief Financial Officer (CFO)"
  ]
};

module.exports.addMetadata = async (req, res) => {
  try {
    const { type, value, isActive } = req.body;
    const leaveExists = await metaData.findOne({ value: value });

    if (leaveExists) {
      return res.status(409).json({ message: "Value Already Exists" });
    }
    let key = 1;
    let existingLeave;
    do {
      existingLeave = await metaData.findOne({ key: key });
      if (existingLeave) {
        key += 1;
      }
    } while (existingLeave);
    const metadata = new metaData({
      key,
      value,
      isActive,
      type
    });
    await metadata.save();
    return res.status(200).json({
      message: "Created Successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.getallMetaData = async (req, res) => {
  try {
    const type = req.query.type;
    const data = await metaData.find({ type });

    return res.status(200).json({
      data: data
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.getDepartment = async (req, res) => {
  try {
    const key = req.params.key;
    const data = designations[key];
    return res.status(200).json({
      data: data
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
