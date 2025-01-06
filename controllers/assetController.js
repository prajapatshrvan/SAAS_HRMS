const Asset = require("../models/Asset.model");
const { join } = require("path");
const Employee = require("../models/Employee.model");
const { assetLabels } = require("../Label.js");
const ExcelJS = require("exceljs");
const Excel = require("../models/Bulkdata.model");
const multer = require("multer");
const fs = require("fs");
const { fileFilter } = require("../config/multer");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);
const moment = require("moment");

const storages = multer.diskStorage({
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
      file.originalname.slice(0, lastDotIndex).replace(" ", "_") + Date.now() + "." + file.originalname.split(".").pop()
    );
  }
});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const empId = await Employee.findOne({ _id: req.user.userObjectId });
      if (!empId) {
        throw new Error("Employee not found");
      }

      let uploadPath = "excel/" + empId.employeeID;
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

const upload = multer({
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
  storage: storages
}).array("image");

const uploadExcel = multer({
  storage: storage
}).single("excel");

module.exports.addAsset = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.log(err);
        return res.status(400).json({
          message: assetLabels.fileUpload_error,
          error: err.message
        });
      }
      const Assetexist = await Asset.findOne({ assetId: req.body.assetId });
      if (Assetexist) {
        return res.status(409).json({
          message: assetLabels.asset_already_exist
        });
      }
      const {
        assetname,
        assetId,
        // date_of_asset,
        purchase_date,
        purchase_from,
        manufacturer,
        model,
        serial_number,
        supplier,
        condition,
        warranty,
        value,
        asset_user,
        description,
        status
      } = req.body;

      const empId = await Employee.findOne({ _id: req.user.userObjectId });
      const images = req.files.map((file) => (file ? `uploads/${empId.employeeID}/${file.filename}` : null));
      const isValidDate = (dateString) => moment(dateString, "YYYY/MM/DD").isValid();
      if (!isValidDate(purchase_date) || !isValidDate(warranty)) {
        return res.status(400).json({
          message: assetLabels.invalid_dateFormat
        });
      }

      // const DateOfAsset = moment(date_of_asset, "YYYY/MM/DD").format("YYYY-MM-DD");
      const PurchaseDate = moment(purchase_date, "YYYY/MM/DD").format("YYYY-MM-DD");
      const Warranty = moment(warranty, "YYYY/MM/DD").format("YYYY-MM-DD");

      const asset = new Asset({
        assetname,
        assetId,
        // date_of_asset: DateOfAsset,
        purchase_date: PurchaseDate,
        purchase_from,
        manufacturer,
        model,
        serial_number,
        supplier,
        condition,
        warranty: Warranty,
        value,
        asset_user,
        description,
        status,
        image: images
      });

      await asset.save();
      console.info(`Asset Assign success ${assetId}`);

      return res.status(200).json({
        message: assetLabels.asset_add_message
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: assetLabels.internal_server_message,
        error: error.message
      });
    }
  });
};

module.exports.Status = async (req, res) => {
  try {
    const { assetId, status } = req.body;
    let statuses = ["unassigned", "repair", "assigned"];
    if (statuses.includes(status)) {
      await Asset.findByIdAndUpdate(assetId, {
        $set: { status: status }
      });
      return res.status(200).json({
        message: `Asset ${status}`
      });
    } else {
      return res.status(400).json({
        message: assetLabels.invalid_status
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.find({ verified: "false" });
    return res.status(200).json({
      Asset: asset
    });
  } catch (error) {
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.invantory = async (req, res) => {
  try {
    const asset = await Asset.find({ verified: "true" });
    return res.status(200).json({
      Asset: asset
    });
  } catch (error) {
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.Assetassign = async (req, res) => {
  try {
    const { assetObject, email_id } = req.body;

    if (!assetObject) {
      return res.status(400).json({ message: assetLabels.Object_id_message });
    } else if (!email_id) {
      return res.status(400).json({ message: assetLabels.Email_id_message });
    } else {
      let findUser = await Employee.findOne({ company_email: email_id });

      if (!findUser) {
        return res.status(400).json({ message: assetLabels.asset_notfound_message });
      }

      let userObject = findUser._id;
      let userName = findUser.firstname;
      const assignBy = req.user.userObjectId;

      const existingAssignment = await Asset.findOne({ _id: assetObject });

      if (!existingAssignment) {
        return res.status(404).send({ message: assetLabels.not_found_message });
      } else if (existingAssignment.status !== "unassigned") {
        return res.status(400).json({ message: assetLabels.asset_already_assign_message });
      } else {
        await Asset.findOneAndUpdate(
          { _id: assetObject },
          {
            $set: { assign_to: userObject, assign_by: assignBy, status: "assigned" }
          }
        );

        return res.status(200).json({
          message: `Asset assigned to ${userName}`
        });
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.AssetAssignList = async (req, res) => {
  try {
    const assetAssign = await Asset.find({ status: "assigned" })
      .populate({ path: "assign_to", select: "firstname lastname status " })
      .populate({ path: "assign_by", select: "firstname lastname status " })
      .select("-createdAt -updatedAt -__v");

    const newdata = [];
    for (let index = 0; index < assetAssign.length; index++) {
      const element = { ...assetAssign[index]?._doc };
      if (element.assign_by) {
        element.assignBy_fullname = element.assign_by.firstname + " " + element.assign_by.lastname;
      }
      if (element.assign_to) {
        element.assign_to_fullname = element.assign_to.firstname + " " + element.assign_to.lastname;
        element.employee_status = element.assign_to.status;
      }

      delete element.assign_by;
      delete element.assign_to;

      newdata.push(element);
    }

    return res.status(200).json({
      Data: newdata
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.PendingAsset = async (req, res) => {
  try {
    const pending = await Asset.find({ status: "Inactive" });
    return res.status(200).json({
      Pending: pending
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.RevokeAsset = async (req, res) => {
  try {
    const { assetId, status } = req.body;
    let statuses = ["unassigned"];
    if (statuses.includes(status)) {
      await Asset.findByIdAndUpdate(assetId, {
        $set: { status: status }
      });
      return res.status(200).json({
        message: `Asset ${status}`
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.UpdateAsset = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          message: assetLabels.fileUpload_error,
          error: err.message
        });
      }

      const {
        assetname,
        assetId,
        // date_of_asset,
        purchase_date,
        purchase_from,
        manufacturer,
        model,
        serial_number,
        supplier,
        condition,
        warranty,
        value,
        asset_user,
        description,
        status
      } = req.body;

      const emp = await Employee.findOne({ _id: req.user.userObjectId });
      const asset = await Asset.findOne({ _id: req.body.id });

      if (!emp) {
        return res.status(404).send("Employee not found");
      }

      const employeeID = emp.employeeID;
      const directoryPath = join(process.cwd(), `uploads/${employeeID}`);

      let images = [];

      if (req.files) {
        images = req.files.map((file) => (file ? `uploads/${employeeID}/${file.filename}` : null));
      }

      if (asset && asset.image && asset.image.length > 0 && images.length > 0) {
        for (const img of asset.image) {
          const filePath = join(directoryPath, img.slice(9 + employeeID.length));
          if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
          }
        }
      }

      const updateFields = {
        assetname,
        assetId,
        // date_of_asset,
        purchase_date,
        purchase_from,
        manufacturer,
        model,
        serial_number,
        supplier,
        condition,
        warranty,
        value,
        asset_user,
        description,
        status
      };

      if (images.length > 0) {
        updateFields.image = images;
      }

      await Asset.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: updateFields
        }
      );

      return res.status(200).json({
        message: assetLabels.asset_update_Success_message
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.getAsset_status = async (req, res) => {
  try {
    const asset = await Asset.find({ status });
    return res.status(200).json({
      Asset: asset
    });
  } catch (error) {
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.Verified = async (req, res) => {
  try {
    if (req.body.verified === "true") {
      await Asset.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: { verified: "true" }
        }
      );
      return res.status(200).json({
        message: assetLabels.asset_verified_message
      });
    } else if (req.body.verified === "false") {
      await Asset.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: { verified: "false" }
        }
      );
      return res.status(200).json({
        message: assetLabels.asset_not_verified_message
      });
    } else {
      return res.status(400).json({
        message: assetLabels.invaid_status_value
      });
    }
  } catch (error) {
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.VerifiedAll = async (req, res) => {
  try {
    const filter = { _id: { $in: req.body.ids } };
    const update = { $set: { verified: req.body.verified } };

    const result = await Asset.updateMany(filter, update);

    if (result.nModified > 0) {
      return res.status(200).json({
        message: `Updated ${result.nModified} All Verified Assets`
      });
    } else {
      return res.status(404).json({
        message: assetLabels.not_update_message
      });
    }
  } catch (error) {
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.getAssetByID = async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id });
    return res.status(200).json({
      Asset: asset
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.bulkAssetUpload = async (req, res) => {
  uploadExcel(req, res, async (err) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: assetLabels.fileUpload_error });
      }

      if (!req.file) {
        return res.status(400).json({ message: assetLabels.file_error });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const worksheet = workbook.getWorksheet(1); // Get the first sheet

      const excelData = [];
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip the header row

        const rowData = {
          assetname: row.getCell(1).value,
          assetId: row.getCell(2).value,
          purchase_date: row.getCell(3).value,
          purchase_from: row.getCell(4).value,
          manufacturer: row.getCell(5).value,
          model: row.getCell(6).value,
          serial_number: row.getCell(7).value,
          supplier: row.getCell(8).value,
          warranty: row.getCell(9).value,
          value: row.getCell(10).value,
          status: row.getCell(11).value,
          description: row.getCell(12).value
        };

        excelData.push(rowData);
      });

      for (const data of excelData) {
        const parsedPurchaseDate = moment(data.purchase_date, "YYYY-MM-DD");
        const parsedWarranty = moment(data.warranty, "YYYY-MM-DD");
        if (parsedPurchaseDate.isValid() && parsedWarranty.isValid()) {
          const formattedPurchaseDate = parsedPurchaseDate.format("YYYY-MM-DD");
          const formattedWarranty = parsedWarranty.format("YYYY-MM-DD");

          await Asset.create({
            assetname: data.assetname,
            assetId: data.assetId,
            purchase_date: formattedPurchaseDate,
            purchase_from: data.purchase_from,
            manufacturer: data.manufacturer,
            model: data.model,
            serial_number: data.serial_number,
            supplier: data.supplier,
            warranty: formattedWarranty,
            value: data.value,
            status: data.status,
            description: data.description
          });
        } else {
          console.error("Invalid date format detected in Excel file");
        }
      }

      const empId = await Employee.findOne({ _id: req.user.userObjectId });
      const excelPath = req.file ? `excel/${empId.employeeID}/${req.file.filename}` : null;
      const newExcelFile = new Excel({
        excelfile: excelPath
      });
      await newExcelFile.save();

      res.status(200).json({ message: assetLabels.upload_And_save_message });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: assetLabels.internal_server_message
      });
    }
  });
};

module.exports.Assetscounter = async (req, res) => {
  try {
    const assigned = await Asset.countDocuments({ status: "assigned" });
   const unassigned = await Asset.countDocuments({ status: "unassigned" });
   const active = await Asset.countDocuments({ status: "active" });
   const inactive = await Asset.countDocuments({ status: "inactive" });
   const repair = await Asset.countDocuments({ status: "repair" });
    return res.status(200).json({
      assigned,
      unassigned,
      active,
      inactive,
      repair
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};
