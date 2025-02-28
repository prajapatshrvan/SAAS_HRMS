const Company = require("../../models/Company.model");

function generateCompanyId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "123456789";

  let id = "";
  for (let i = 0; i < 2; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  for (let i = 0; i < 2; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return id;
}

module.exports.AddCompany = async (req, res) => {
  try {
    const company_name = req.body.company_name;

    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const existCompany = await Company.findOne({ company_name });
    if (existCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }

    let companyid;
    let isUnique = false;

    while (!isUnique) {
      companyid = generateCompanyId();
      isUnique = !await Company.exists({ companyid });
    }

    const company = new Company({
      company_name,
      companyid
    });

    await company.save();

    return res.status(201).json({ message: "Company added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports.getCompany = async (req, res) => {
  try {
    const company = await Company.find();
    return res.render("company.ejs", { company: company });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.deleteCompany = async (req, res) => {
  try {
    const id = req.params.id;
    await Company.findByIdAndDelete(id);
    return res.status(200).json({ message: "Company delete successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
