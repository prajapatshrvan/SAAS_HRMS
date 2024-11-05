const Logo = require("../models/Logo.model");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const lastDotIndex = file.originalname.lastIndexOf(".");
    cb(
      null,
      file.originalname.slice(0, lastDotIndex).replace(" ", "_") + Date.now() + "." + file.originalname.split(".").pop()
    );
  },
});

const uploads = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 },
}).single("logo_image");

module.exports.addCompanyLogo = async (req, res) => {
  uploads(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Error uploading file", error: err });
      } else if (err) {
        return res.status(500).json({ message: "Internal Server Error", error: err });
      }

      const { empid, company_name } = req.body;
      const logo_image = req.file.filename;

      if (!logo_image) {
        return res.status(400).json({
          message: "Invalid Document",
        });
      }

      const existingLogo = await Logo.findOne({ company_name });
      if (existingLogo) {
        return res.status(409).json({
          message: "Logo already exists for the provided company name",
        });
      }

      const newLogo = new Logo({
        empId: empid,
        logo_image: req.file ? `uploads/${req.file.filename}` : null,
        company_name: company_name,
      });
      await newLogo.save();

      res.status(200).json({ message: "success", logo: newLogo });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error", error: error });
    }
  });
};

module.exports.updateCompanyLogo = async (req, res) => {
  uploads(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Error uploading file", error: err });
      } else if (err) {
        return res.status(500).json({ message: "Internal Server Error", error: err });
      }
      const { id, company_name } = req.body;
      const logo_image = req.file ? `uploads/${req.file.filename}` : null;
      if (!logo_image) {
        return res.status(400).json({
          message: "Invalid Document",
        });
      }
      const updateFields = {
        company_name,
        logo_image,
      };

      await Logo.findByIdAndUpdate(id, { $set: updateFields });

      return res.status(200).json({
        message: "Logo updated successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  });
};

module.exports.deleteCompanyLogo = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Missing 'id' field in the request body" });
    }
    const documnet = await Logo.findOneAndDelete({ _id: id });
    if (!documnet) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports.CompanyLogoList = async (req, res) => {
  try {
    const listLogo = await Logo.find();
    return res.status(200).json({
      List: listLogo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
