const HeaderFooter = require("../models/header.footer.model");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${nameWithoutExt}_${Date.now()}${ext}`);
  },
});

const uploads = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 },
}).fields([{ name: "header_image" }, { name: "footer_image" }]);

module.exports.addheaderfooter = async (req, res) => {
  uploads(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Error uploading file", error: err });
      } else if (err) {
        return res.status(500).json({ message: "Internal Server Error", error: err });
      }

      const { empid } = req.body;
      const headerImageFile = req.files["header_image"] ? req.files["header_image"][0] : null;
      const footerImageFile = req.files["footer_image"] ? req.files["footer_image"][0] : null;

      if (!headerImageFile || !footerImageFile) {
        return res.status(400).json({
          message: "Invalid Document",
        });
      }

      const header_image = headerImageFile.filename;
      const footer_image = footerImageFile.filename;

      const existingheaderfooter = await HeaderFooter.findOne({
        $or: [{ header_image }, { footer_image }],
      });

      if (existingheaderfooter) {
        return res.status(409).json({
          message: "Header & Footer already exists",
        });
      }

      const newHeaderFooter = new HeaderFooter({
        empId: empid,
        header_image: `uploads/${header_image}`,
        footer_image: `uploads/${footer_image}`,
      });
      await newHeaderFooter.save();

      res.status(200).json({ message: "success" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error", error: error });
    }
  });
};

module.exports.deleteHeaderFooter = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Missing 'id' field in the request body" });
    }
    const documnet = await HeaderFooter.findOneAndDelete({ _id: id });
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

module.exports.CompanyHeaderFooterList = async (req, res) => {
  try {
    const listHeaderFooter = await HeaderFooter.find();
    return res.status(200).json({
      List: listHeaderFooter,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
