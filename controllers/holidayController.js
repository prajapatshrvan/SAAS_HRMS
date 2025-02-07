const Holiday = require("../models/Holiday.model");
const ApiCRUDController = require("../controllers/ApiCrudController");
const moment = require("moment");
const getResourcesForUser = require("../utility/generatePassword.js");

module.exports.addBulkHoliday = async (req, res) => {
  try {
    const {
      year: requestedYear,
      country: requestedCountry,
      state: requestedState,
      holiday_name,
      date
    } = req.body;

    // Validate required fields
    if (!requestedCountry)
      return res.status(400).json({ message: "Please select country" });
    if (!requestedState)
      return res.status(400).json({ message: "Please select state" });
    if (!requestedYear)
      return res.status(400).json({ message: "Please select year" });
    if (!holiday_name)
      return res.status(400).json({ message: "Please fill holiday name" });
    if (!date) return res.status(400).json({ message: "Please fill date" });

    // Validate the date format
    const validDate = new Date(date);
    if (isNaN(validDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Normalize the date to start of the day (UTC)
    const formattedDate = new Date(validDate);
    formattedDate.setUTCHours(0, 0, 0, 0);

    // Get the day of the week
    const dayOfWeek = formattedDate.toLocaleDateString("en-US", {
      weekday: "long"
    });

    // Check for existing holiday with the same name and date
    const existingHoliday = await Holiday.findOne({
      holiday_name,
      year: requestedYear,
      country: requestedCountry,
      state: requestedState,
      date: formattedDate
    });

    if (existingHoliday) {
      return res
        .status(400)
        .json({ message: "This holiday already exists for this date" });
    }

    const newHoliday = new Holiday({
      country: requestedCountry,
      state: requestedState,
      year: requestedYear,
      day: dayOfWeek,
      date: formattedDate,
      holiday_name
    });

    await newHoliday.save();

    return res.status(200).json({ message: "Holiday added successfully." });
  } catch (error) {
    console.error("Error in addBulkHoliday:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// module.exports.UpdateHoliday = async (req, res) => {
//   try {
//     // const userRoleMapping = {
//     //   _id: req.user.userObjectId,
//     //   userId: req.user.userId,
//     //   role: req.user.role_name,
//     //   inherits: req.user.userInheritedRoles
//     // };

//     // const userResources = await getResourcesForUser(userRoleMapping);

//     // Check if the user has the required permissions
//     // if (
//     //   !userResources &&
//     //   !userResources["holidays"] &&
//     //   !userResources["holidays"].includes("edit")
//     // ) {
//     //   return res.status(403).json({ message: "Access denied" });
//     // }
//     const id = req.query.id;
//     const { country, state, year, holiday_status, holiday } = req.body;

//     if (
//       !country ||
//       !state ||
//       !year ||
//       !holiday ||
//       !Array.isArray(holiday) ||
//       holiday.length === 0
//     ) {
//       return res.status(400).json({
//         message: "Invalid or incomplete request data"
//       });
//     }

//     const holidaysWithDay = holiday.map(h => {
//       const [month, day] = h.date;
//       if (isNaN(month) || isNaN(day)) {
//         return { ...h, date: null, day: "Invalid Date" };
//       }

//       const formattedDate = `${month}-${day}`;
//       const dayOfWeek = new Date(
//         `${year}-${formattedDate}`
//       ).toLocaleDateString("en-US", { weekday: "long" });

//       return { ...h, date: formattedDate, day: dayOfWeek };
//     });

//     const validHolidays = holidaysWithDay.filter(h => h.date !== null);

//     if (validHolidays.length === 0) {
//       return res.status(400).json({
//         message: "No valid dates provided"
//       });
//     }
//     const updateFields = {
//       country,
//       state,
//       year,
//       holiday_status,
//       holiday: validHolidays
//     };
//     await Holiday.findByIdAndUpdate(id, { $set: updateFields });
//     return res.status(200).json({
//       message: "Update Data Sucessfully"
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal Server Error"
//     });
//   }
// };

module.exports.UpdateHoliday = async (req, res) => {
  try {
    const id = req.query.id;
    const { country, state, year, holiday_status, holiday } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Holiday ID is required" });
    }

    if (
      !country ||
      !state ||
      !year ||
      !Array.isArray(holiday) ||
      holiday.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or incomplete request data" });
    }

    // Process holiday array to include correct date and day
    const holidaysWithDay = holiday.map(h => {
      const [month, day] = h.date; // Assuming date format [month, day]

      if (!month || !day || isNaN(month) || isNaN(day)) {
        return { ...h, date: null, day: "Invalid Date" };
      }

      // Create a valid Date object (YYYY-MM-DD format)
      const formattedDate = new Date(year, month - 1, day);

      return {
        ...h,
        date: formattedDate,
        day: formattedDate.toLocaleDateString("en-US", { weekday: "long" })
      };
    });

    // Remove invalid dates
    const validHolidays = holidaysWithDay.filter(h => h.date !== null);

    if (validHolidays.length === 0) {
      return res.status(400).json({ message: "No valid dates provided" });
    }

    // Prepare update object
    const updateFields = {
      country,
      state,
      year,
      holiday_status,
      holiday: validHolidays
    };

    // Update holiday in MongoDB
    const updatedHoliday = await Holiday.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedHoliday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    return res.status(200).json({
      message: "Holiday updated successfully",
      data: updatedHoliday
    });
  } catch (error) {
    console.error("Error in UpdateHoliday:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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

    const list = await Holiday.find(query).sort({ date: 1 });

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
