const Holiday = require("../models/Holiday.model");
const ApiCRUDController = require("../controllers/ApiCrudController");
const moment = require("moment");
const getResourcesForUser = require("../utility/generatePassword.js");

// module.exports.addBulkHoliday = async (req, res) => {
//   try {
//     const userRoleMapping = {
//       _id: req.user.userObjectId,
//       userId: req.user.userId,
//       role: req.user.role_name,
//       inherits: req.user.userInheritedRoles
//     };

//     const userResources = await getResourcesForUser(userRoleMapping);

//     if (userResources) {
//       const { year: requestedYear, country: requestedCountry, state: requestedState, holiday_name, date } = req.body;

//       if (!requestedCountry) {
//         return res.status(400).json({ message: "Please select country" });
//       }
//       if (!requestedState) {
//         return res.status(400).json({ message: "Please select state" });
//       }
//       if (!requestedYear) {
//         return res.status(400).json({ message: "Please select year" });
//       }
//       if (!holiday_name) {
//         return res.status(400).json({ message: "Please fill holiday name" });
//       }
//       if (!date) {
//         return res.status(400).json({ message: "Please fill date" });
//       }

//       // Check if the date is valid
//       const validDate = new Date(date);
//       if (isNaN(validDate.getTime())) {
//         return res.status(400).json({ message: "Invalid date format" });
//       }

//       // Check for existing holiday with the same name, year, country, and state
//       let existingHolidays = await Holiday.findOne({
//         holiday_name,
//         year: requestedYear,
//         country: requestedCountry,
//         state: requestedState
//       });

//       if (existingHolidays) {
//         return res.status(400).json({ message: "This holiday already exists" });
//       }

//       // Format the date and get the day of the week
//       const formattedDate = validDate.toISOString().split("T")[0];
//       const dayOfWeek = validDate.toLocaleDateString("en-US", { weekday: "long" });

//       // Create a new holiday
//       const newHoliday = new Holiday({
//         country: requestedCountry,
//         state: requestedState,
//         year: requestedYear,
//         day: dayOfWeek,
//         date: formattedDate,
//         holiday_name
//       });

//       // Save the new holiday to the database
//       await newHoliday.save();

//       return res.status(200).json({
//         message: "Holiday added successfully."
//       });
//     } else {
//       return res.status(403).json({ message: "Access denied" });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: "Internal Server Error"
//     });
//   }
// };

module.exports.addBulkHoliday = async (req, res) => {
  try {
    // const userRoleMapping = {
    //   _id: req.user.userObjectId,
    //   userId: req.user.userId,
    //   role: req.user.role_name,
    //   inherits: req.user.userInheritedRoles
    // };
    // const userResources = await getResourcesForUser(userRoleMapping);

    // if (
    //   !userResources &&
    //   !userResources["holidays"] &&
    //   !userResources["holidays"].includes("create")
    // ) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const {
      year: requestedYear,
      country: requestedCountry,
      state: requestedState,
      holiday_name,
      date
    } = req.body;

    if (!requestedCountry) {
      return res.status(400).json({ message: "Please select country" });
    }
    if (!requestedState) {
      return res.status(400).json({ message: "Please select state" });
    }
    if (!requestedYear) {
      return res.status(400).json({ message: "Please select year" });
    }
    if (!holiday_name) {
      return res.status(400).json({ message: "Please fill holiday name" });
    }
    if (!date) {
      return res.status(400).json({ message: "Please fill date" });
    }

    // Validate the date format
    const validDate = new Date(date);
    if (isNaN(validDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Check for existing holiday
    const existingHoliday = await Holiday.findOne({
      holiday_name,
      year: requestedYear,
      country: requestedCountry,
      state: requestedState
    });

    if (existingHoliday) {
      return res.status(400).json({ message: "This holiday already exists" });
    }

    // Format the date and determine the day of the week
    const formattedDate = validDate.toISOString().split("T")[0];
    const dayOfWeek = validDate.toLocaleDateString("en-US", {
      weekday: "long"
    });

    // Create and save the new holiday
    const newHoliday = new Holiday({
      country: requestedCountry,
      state: requestedState,
      year: requestedYear,
      day: dayOfWeek,
      date: formattedDate,
      holiday_name
    });

    await newHoliday.save();

    return res.status(200).json({
      message: "Holiday added successfully."
    });
  } catch (error) {
    console.error("Error in addBulkHoliday:", error); // Improved logging
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.UpdateHoliday = async (req, res) => {
  try {
    const userRoleMapping = {
      _id: req.user.userObjectId,
      userId: req.user.userId,
      role: req.user.role_name,
      inherits: req.user.userInheritedRoles
    };

    const userResources = await getResourcesForUser(userRoleMapping);

    // Check if the user has the required permissions
    if (
      !userResources &&
      !userResources["holidays"] &&
      !userResources["holidays"].includes("edit")
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    const id = req.query.id;
    const { country, state, year, holiday_status, holiday } = req.body;

    if (
      !country ||
      !state ||
      !year ||
      !holiday ||
      !Array.isArray(holiday) ||
      holiday.length === 0
    ) {
      return res.status(400).json({
        message: "Invalid or incomplete request data"
      });
    }

    const holidaysWithDay = holiday.map(h => {
      const [month, day] = h.date.split("-");
      if (isNaN(month) || isNaN(day)) {
        return { ...h, date: null, day: "Invalid Date" };
      }

      const formattedDate = `${month}-${day}`;
      const dayOfWeek = new Date(
        `${year}-${formattedDate}`
      ).toLocaleDateString("en-US", { weekday: "long" });

      return { ...h, date: formattedDate, day: dayOfWeek };
    });

    const validHolidays = holidaysWithDay.filter(h => h.date !== null);

    if (validHolidays.length === 0) {
      return res.status(400).json({
        message: "No valid dates provided"
      });
    }
    const updateFields = {
      country,
      state,
      year,
      holiday_status,
      holiday: validHolidays
    };
    await Holiday.findByIdAndUpdate(id, { $set: updateFields });
    return res.status(200).json({
      message: "Update Data Sucessfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.deleteHoliday = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res
        .status(400)
        .json({ message: "Missing 'date' field in the request body" });
    }
    const holiday = await Holiday.findOneAndDelete({ date });
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.HolidayStatus = async (req, res) => {
  try {
    const { id, holiday_status } = req.body;
    let statuses = ["pending", "approved", "rejected"];
    if (statuses.includes(holiday_status)) {
      await Holiday.findByIdAndUpdate(id, {
        $set: { holiday_status: holiday_status }
      });
      return res.status(200).json({
        message: `Holiday ${holiday_status}`
      });
    } else {
      return res.status(400).json({
        message: "Invalid status Please Enter Valid Status"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: assetLabels.internal_server_message
    });
  }
};

module.exports.List = async (req, res) => {
  try {
    const { holiday_status, year, country, state } = req.query;
    // Set default values if not provided
    const currentYear = moment().format("YYYY");
    const defaultYear = year || currentYear;
    const defaultCountry = country || "India";
    const defaultState = state || "Rajasthan";

    const query = {
      country: defaultCountry,
      state: defaultState,
      year: defaultYear
    };

    if (holiday_status) {
      query.holiday_status = holiday_status;
    }

    const list = await Holiday.find(query);

    res.status(200).json({
      list
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.getholiday = async (req, res) => {
  try {
    const id = req.query.id;
    const status = await Holiday.findById(id);
    return res.status(200).json({
      status
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.approved_and_rejected = async (req, res) => {
  try {
    if (req.body.holiday_status === "approved") {
      await Holiday.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: { holiday_status: "approved" }
        }
      );
      return res.status(200).json({
        message: "approved"
      });
    } else if (req.body.holiday_status === "rejected") {
      await Holiday.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: { holiday_status: "rejected" }
        }
      );
      return res.status(200).json({
        message: "rejected"
      });
    } else {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
