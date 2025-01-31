const Salary = require("../models/salaryModel");
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");
const Holiday = require("../models/Holiday.model");
const AdvanceSalary = require("../models/advanceSalary.model");
const Payrollcostdata = require("../models/parrollcostSummerdata.model");
const Leave = require("../models/Leave.model");
const adSalaryTransition = require("../models/advanceSalarytransions.model");
const Logo = require("../models/Logo.model");
const DocumentAddress = require("../models/documentAddress.model");
const puppeteer = require("puppeteer");
const numberToWords = require("number-to-words");

const moment = require("moment");
const { default: mongoose } = require("mongoose");

const leave_carry_forward = async (empid, absent) => {
  try {
    const employee = await Employee.findOne({ _id: empid }).select("cf");
    if (!employee) {
      throw new Error(`Employee with ID ${empid} not found.`);
    }

    let cfLeave = employee.cf || 0;
    let remainingAbsent = absent;

    if (absent > 0) {
      if (cfLeave >= absent) {
        cfLeave -= absent;
        remainingAbsent = 0;
      } else {
        remainingAbsent -= cfLeave;
        cfLeave = 0;
      }
    } else {
      cfLeave += 1;
    }
    await Employee.findByIdAndUpdate(empid, { cf: cfLeave }, { new: true });

    return {
      updatedCfLeave: cfLeave,
      remainingAbsent
    };
  } catch (error) {
    console.error("Error in leave carry forward:", error.message);
    throw error;
  }
};

const calculateSalaryComponents = totalPaidAmount => {
  const basicSalary = totalPaidAmount * 30 / 100;
  // const hra = totalPaidAmount * 25 / 100;
  //  const ta = totalPaidAmount * 10 / 100;
  //  const da = totalPaidAmount * 10 / 100;
  // const other = totalPaidAmount * 25 / 100;

  return {
    basicSalary: parseFloat(basicSalary.toFixed(2))
    // hra: parseFloat(hra.toFixed(2)),
    //  ta: parseFloat(ta.toFixed(2)),
    //  da: parseFloat(da.toFixed(2)),
    // other: parseFloat(other.toFixed(2))
  };
};

function countSundays(startDate, endDate) {
  let start = new Date(startDate);
  let end = new Date(endDate);
  let count = 0;

  while (start <= end) {
    if (start.getDay() === 0) {
      // Sunday is represented by 0
      count++;
    }
    start.setDate(start.getDate() + 1); // Move to the next day
  }

  return count;
}

const createSalary = async (req, res) => {
  try {
    const Year = moment().format("YYYY");
    const Month = moment().format("MM");

    const existingSalary = await Salary.findOne({ month: Month, year: Year });
    // if (existingSalary) {
    //   return res.status(400).json({
    //     message: `Salary for ${Month}-${Year} Already Created.`
    //   });
    // }

    // Remove this after testing
    const employees = await Employee.find({ status: "completed" });
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const totalDaysInCurrentMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();
    const monthdays = totalDaysInCurrentMonth - 25 + 25;
    const startDate = moment(`${Year}-${Month}-26`)
      .subtract(1, "month")
      .startOf("day");
    const endDate = moment(`${Year}-${Month}-25`).endOf("day");
    const currentDate = moment().format("YYYY-MM-DD");

    const salaries = [];
    for (const emp of employees) {
      const leaves = await Leave.find({
        empid: emp._id,
        status: "approved",
        start_date: { $gte: startDate, $lte: endDate }
      });

      const totalLeaveDays = leaves.reduce(
        (acc, curr) => acc + curr.leave_days,
        0
      );

      // const unpaidLeave = Math.max(totalLeaveDays - 1, 0);

      const absentCount = await Attendance.countDocuments({
        empid: emp._id,
        status: false,
        date: { $gte: startDate, $lte: endDate }
      });

      const workingDayCount = await Attendance.countDocuments({
        empid: emp._id,
        status: true,
        date: { $gte: startDate, $lte: endDate }
      });

   const STARTDATE =  emp.joining_date && (emp.joining_date.getMonth() == new Date().getMonth() && emp.joining_date.getFullYear() == new Date().getFullYear()) ? emp.joining_date : startDate

   const sundays = countSundays(STARTDATE ,endDate)

      const {remainingAbsent} = await leave_carry_forward(emp._id, absentCount)

      console.log(remainingAbsent , "remainingAbsent")

      const totalPaidDays = sundays + workingDayCount

      console.log(totalPaidDays , "totalPaidDays")

      const remainingDays = monthdays - remainingAbsent;

      console.log(remainingDays , "remainingDays")

      // const validRemainingDays = Math.max(remainingDays, 0);

      if (!emp.ctcDetails || !parseInt(emp.ctcDetails.monthlycompensation)) {
        console.error(`Missing monthly compensation for employee ${emp._id}`);
        continue;
      }
      const totalGrossSalary = parseInt(emp.ctcDetails.monthlycompensation.replaceAll("," , "")) || 0;
      const perDaySalary = (totalGrossSalary / monthdays).toFixed(2);
      const leaveDeduction = perDaySalary * remainingAbsent;
      const totalPaidAmount = totalPaidDays * perDaySalary;

      const { basicSalary } = calculateSalaryComponents(totalPaidAmount);

      const pf = (totalPaidAmount * 0.3 * 0.24).toFixed(2);
      let esi = 0;
      if (totalGrossSalary < 21000) {
        esi = (totalPaidAmount * 0.04).toFixed(2);
      }

      let netSalary = parseFloat(totalPaidAmount - (parseFloat(pf) - parseFloat(esi)) ).toFixed(2);
      netSalary = isNaN(netSalary) ? 0 : netSalary;

       //Total Net Salary=Net Salary+Additional Earnings
       const totalNetSalary = netSalary

      const advanceSalary = await AdvanceSalary.findOne({
        empid: emp._id,
        status: "pending"
      });

      let advanceDeduction = 0;
      if (advanceSalary) {
        advanceDeduction = advanceSalary.emi_amount || 0;
        netSalary -= advanceDeduction;

        advanceSalary.instalment -= 1;
        advanceSalary.paidAmount += advanceDeduction;

        if (advanceSalary.instalment < 1) {
          advanceSalary.status = "completed";
        }

        await advanceSalary.save();

        await adSalaryTransition.create({
          empid: emp._id,
          advanceSalaryId: advanceSalary._id,
          emiNumber: advanceSalary.emiNumber,
          totalEmiCount: advanceSalary.instalment,
          totalAmount: advanceSalary.amount,
          remainingAmount: advanceSalary.amount - advanceSalary.paidAmount,
          emiAmount: advanceDeduction
        });
      }

      const cfremaining = await Leave.findOne({
        empid: emp._id
      }).then(balance => balance?.cfremaining || 0);

      const paidLeave = Math.min(1 + cfremaining, totalLeaveDays);

      const totalDeduction = (parseFloat(pf) +
        parseFloat(esi) +
        parseFloat(leaveDeduction) +
        parseFloat(advanceDeduction)).toFixed(0);

      salaries.push(
        new Salary({
          empid: emp._id,
          empname: `${emp.firstname} ${emp.middlename} ${emp.lastname}`,
          employeeID: emp.employeeID,
          designation: emp.designation,
          department: emp.department,
          date_of_joining: new Date(emp.joining_date).toLocaleDateString(),
          pancard_No: emp.pancard_no,
          account_no: emp.bankdetails.account_no,
          gender: emp.gender,
          date: currentDate,
          month: Month,
          year: Year,
          salary_status: "pending",
          payment_status: false,
          totalCTC: parseInt(emp.ctcDetails.totalctc.replaceAll(",", "")) || 0,
          basicSalary: parseInt(basicSalary) || 0,
          hra:  0,
          ta: 0,
          da:  0,
          other:  0,
          paydays: totalPaidDays ,
          pf: parseFloat(pf) || 0,
          esi: parseFloat(esi) || 0,
          countPardaysalary: parseFloat(perDaySalary) || 0,
          remainingDays: remainingDays,
          presentDay: workingDayCount,
          totalLeave: absentCount || 0,
          unpaidLeave : remainingAbsent,
          paidLeave,
          netSalary: parseInt(netSalary),
          grossSalary : totalPaidAmount.toFixed(0),
          totalGrossSalary:totalGrossSalary.toFixed(0),
          totalnetsalary: totalNetSalary,
          leaveDeduction: parseFloat(leaveDeduction) || 0,
          advanceSalary: parseFloat(advanceDeduction) || 0,
          miscellaneous: 0,
          totaldeduction: parseFloat(totalDeduction) || 0
        })
      );
    }

    // await Salary.insertMany(salaries);

    return res.status(200).json({
      message: "Salaries created successfully"
    });
  } catch (error) {
    console.error("Error creating salaries:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// async function createSalary(req, res) {
//   try {
//     const Year = moment().format("YYYY");
//     const Month = moment().format("MM");

//     const existingSalary = await Salary.findOne({ month: Month, year: Year });
//     if (existingSalary) {
//       return res.status(400).json({
//         message: `Salary for ${Month}-${Year} Already Created.`
//       });
//     }

//     const employees = await Employee.find({ status: "completed" });
//     const date = new Date();
//     const currentMonth = date.getMonth();
//     const currentYear = date.getFullYear();
//     const totalDaysInCurrentMonth = new Date(
//       currentYear,
//       currentMonth + 1,
//       0
//     ).getDate();
//     const monthdays = totalDaysInCurrentMonth - 25 + 25;

//     const startDate = moment(`${Year}-${Month}-26`)
//       .subtract(1, "month")
//       .startOf("day");
//     const endDate = moment(`${Year}-${Month}-25`).endOf("day");
//     const currentDate = moment().format("YYYY-MM-DD");

//     const salaries = [];
//     for (const emp of employees) {
//             const leaves = await Leave.find({
//               empid: emp._id,
//               status: "approved",
//               start_date: { $gte: startDate, $lte: endDate }
//             });
      
            
//             const totalLeaveDays = leaves.reduce(
//               (prev, curr) => prev + curr.leave_days,
//               0
//             );
            
//             // const unpaidLeave = Math.max(totalLeaveDays - 1, 0);
            
//             const absentCount = await Attendance.countDocuments({
//               empid: emp._id,
//               status: false,
//               date: { $gte: startDate, $lte: endDate }
//             });
            
            
//             const workingDayCount = await Attendance.countDocuments({
//               empid: emp._id,
//               status: true,
//               date: { $gte: startDate, $lte: endDate }
//             });
            
            
//             const STARTDATE =  emp.joining_date && (emp.joining_date.getMonth() == new Date().getMonth() && emp.joining_date.getFullYear() == new Date().getFullYear()) ? emp.joining_date : startDate
            
//             const sundays = countSundays(STARTDATE ,endDate)
            

//             console.log(emp.firstname ,"=>", emp._id , "||"," taken leaves =>", totalLeaveDays ," ||", "system leaves => " , absentCount , "||" , "Working Days =>" , workingDayCount , "||","sundays => ",sundays);

//             const {remainingAbsent} = await leave_carry_forward(emp._id, absentCount)
      
//             const totalPaidDays = sundays + workingDayCount
//             const remainingDays = monthdays - remainingAbsent;
      
      
//             // const validRemainingDays = Math.max(remainingDays, 0);
      
//             if (!emp.ctcDetails || !parseInt(emp.ctcDetails.monthlycompensation)) {
//               console.error(`Missing monthly compensation for employee ${emp._id}`);
//               continue;
//             }
//             const totalGrossSalary = parseInt(emp.ctcDetails.monthlycompensation.replaceAll("," , "")) || 0;
//             const perDaySalary = (totalGrossSalary / monthdays).toFixed(2);
//             const leaveDeduction = perDaySalary * remainingAbsent;
//             const totalPaidAmount = totalPaidDays * perDaySalary;
      
//             const { basicSalary } = calculateSalaryComponents(totalPaidAmount);
      
//             const pf = (totalPaidAmount * 0.3 * 0.24).toFixed(2);
//             let esi = 0;
//             if (totalGrossSalary < 21000) {
//               esi = (totalPaidAmount * 0.04).toFixed(2);
//             }
      
//             let netSalary = parseFloat(totalPaidAmount - (parseFloat(pf) - parseFloat(esi)) ).toFixed(2);
//             netSalary = isNaN(netSalary) ? 0 : netSalary;
      
//              //Total Net Salary=Net Salary+Additional Earnings
//              const totalNetSalary = netSalary
      
//             const cfremaining = await Leave.findOne({
//               empid: emp._id
//             }).then(balance => balance?.cfremaining || 0);
      
//             const paidLeave = Math.min(1 + cfremaining, totalLeaveDays);
      
//             const totalDeduction = (parseFloat(pf) +
//               parseFloat(esi) +
//               parseFloat(leaveDeduction))
//               // parseFloat(advanceDeduction)).toFixed(0);
//           }


//           return res.status(200).send({
//             success : true
//           })

//   } catch (error) {
//     console.error("Error creating salaries:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// }
module.exports = {
  createSalary
};

module.exports.salaryList = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();

    let firstDateOfMonth, lastDateOfMonth;

    if (month && year) {
      const yearInt = parseInt(year, 10);
      const monthInt = parseInt(month, 10) - 1;

      if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 0 || monthInt > 11) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      firstDateOfMonth = new Date(yearInt, monthInt, 1).toISOString();
      lastDateOfMonth = new Date(yearInt, monthInt + 1, 0).toISOString();
    } else {
      firstDateOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      lastDateOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).toISOString();
    }

    let salaryList;
    if (
      req.role_name === "ADMIN" ||
      req.role_name === "SUPERADMIN" ||
      req.role_name === "HR"
    ) {
      salaryList = await Salary.find({
        date: {
          $gte: firstDateOfMonth,
          $lte: lastDateOfMonth
        }
      }).populate({
        path: "empid",
        select: "firstname lastname employeeID image"
      });
    } else {
      salaryList = await Salary.find({
        empid: req.user.userObjectId,
        date: {
          $gte: firstDateOfMonth,
          $lte: lastDateOfMonth
        }
      }).populate({
        path: "empid",
        select: "firstname lastname employeeID image"
      });
    }

    const newData = salaryList.map(salary => {
      const { empid, ...rest } = salary.toObject();
      if (!empid) {
        return {
          ...rest,
          employee_name: "Unknown",
          empid: null,
          employeeID: "Unknown",
          image: "Unknown"
        };
      }
      return {
        ...rest,
        employee_name: `${empid.firstname} ${empid.lastname}`,
        empid: empid._id,
        employeeID: empid.employeeID,
        image: empid.image
      };
    });

    return res.status(200).json({
      SalaryList: newData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.EmployeeSalaryList = async (req, res) => {
  try {
    const salaryList = await Salary.find({
      empid: req.user.userObjectId
    }).populate({
      path: "empid",
      select: "firstname lastname employeeID image"
    });

    // Map through the results and format the data
    const newData = salaryList.map(salary => {
      const { empid, ...rest } = salary.toObject(); // Convert document to plain object

      if (!empid) {
        return {
          ...rest,
          employee_name: "Unknown",
          empid: null,
          employeeID: "Unknown",
          image: "Unknown"
        };
      }

      return {
        ...rest,
        employee_name: `${empid.firstname} ${empid.lastname}`,
        empid: empid._id,
        employeeID: empid.employeeID,
        image: empid.image
      };
    });

    // Return the formatted data as a response
    return res.status(200).json({
      SalaryList: newData
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching salary list:", error);

    // Respond with an error message
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.updatedSalary = async (req, res) => {
  try {
    const id = req.body.id;
    const salaryList = await Salary.findById(id);

    if (!salaryList) {
      return res.status(404).json({
        message: "Salary not found"
      });
    }

    const { bonus, miscellaneous, description } = req.body;
    const totalDeductions = salaryList.totaldeduction + miscellaneous;
    const netSalary = salaryList.totaldeduction + bonus || 0;
    const grossSalary = salaryList.grossSalary + miscellaneous;
    const updatedList = await Salary.findByIdAndUpdate(
      id,
      {
        $set: {
          bonus,
          miscellaneous,
          netSalary,
          description,
          totalDeductions,
          grossSalary
        }
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Salary updated successfully",
      updatedSalary: updatedList
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.UpdateSalarystatus = async (req, res) => {
  try {
    const { id } = req.body;
    const updateStatus = await Salary.updateMany(
      { _id: { $in: id } },
      { $set: { salary_status: "approved" } }
    );
    return res.status(200).json({
      message: "Salary statuses updated successfully",
      success: true,
      UpdateStatus: updateStatus
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.PaySalary = async (req, res) => {
  try {
    const { id } = req.body;

    if (!Array.isArray(id) || id.length === 0) {
      return res.status(400).json({
        message: "Invalid input, 'id' should be a non-empty array"
      });
    }

    for (const salaryId of id) {
      let salary = await Salary.findOne({
        salary_status: "approved",
        _id: salaryId
      });
      if (salary) {
        await Salary.findByIdAndUpdate(salary._id, {
          $set: { payment_status: true }
        });
      }
    }

    return res.status(200).json({
      message: "Salary statuses updated successfully",
      success: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.Updatetatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const statuss = ["hold", "edited"];

    if (statuss.includes(status)) {
      const updateStatus = await Salary.updateMany(
        { _id: id },
        { $set: { salary_status: status } }
      );

      return res.status(200).json({
        message: "salary status update successful",
        success: true
      });
    } else {
      return res.status(400).json({
        message: "invalid status"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.trasitionHistoryList = async (req, res) => {
  try {
    const empid = req.query.empid;

    const currentDate = new Date();
    let firstDateOfLastMonth, lastDateOfLastMonth;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    if (currentMonth === 0) {
      firstDateOfLastMonth = new Date(currentYear - 1, 11, 1);
      lastDateOfLastMonth = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999);
    } else {
      firstDateOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
      lastDateOfLastMonth = new Date(
        currentYear,
        currentMonth,
        0,
        23,
        59,
        59,
        999
      );
    }

    const transionhistorie = await adSalaryTransition.find({
      empid: empid,
      createdAt: {
        $gte: firstDateOfLastMonth,
        $lte: lastDateOfLastMonth
      }
    });

    if (transionhistorie.length === 0) {
      return res.status(404).json({
        message: "No transition history found for the last month"
      });
    }

    return res.status(200).json({
      transionhistorie
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.SalarySlip = async (req, res) => {
  try {
    const id = req.query.id;
    const salaryslip = await Salary.findById(id);

    if (!salaryslip) {
      return res.status(404).json({ message: "Salary slip not found" });
    }

    const logo = await Logo.findOne({}).select("logo_image");
    const address = await DocumentAddress.findOne({}).select(
      "line1 line2 line3 country state city zip"
    );
    const netSalaryInWords = capitalizeFirstLetter(
      numberToWords.toWords(salaryslip.totalnetsalary)
    );

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getMonthName(monthNumber) {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      return months[monthNumber - 1];
    }

    const monthName = getMonthName(salaryslip.month);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Slip</title>
  <style>
    body {
      background-color: #f4f4f4;
      font-family: Arial, sans-serif;
      margin: 10px;
      font-size: 14px;
    }
    .rows {
      padding: 10px;
    }
    .salary-slip {
      border: 1px solid #ddd;
      padding: 20px;
      box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgb(209, 213, 219) 0px 0px 0px 1px inset;
    }
    .salary-slip h1 {
      text-align: center;
      font-size: 26px;
    }
    .salary-slip .details table,
    .salary-slip .earnings table,
    .salary-slip .deductions table {
      width: 100%;
      border-collapse: collapse;
    }
    .salary-slip table th,
    .salary-slip table td {
      border: 1px solid black;
      padding: 8px;
      text-align: left;
    }
    .salary-slip .total {
      text-align: right;
      font-weight: bold;
    }
    .salary-slip .earnings th,
    .salary-slip .deductions th {
      text-align: center;
    }
    .salary-slip .gap-row td {
      border: none;
      height: 10px;
    }
    .note {
      margin-top: 10px;
    }
    .log {
      display: grid;
      grid-template-columns: 52% 48%;
    }
    .address {
      padding: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="rows">
      <div class="salary-slip">
        <div class="log">
          <div>
            <img src="${process.env.HOST}/${logo
      ? logo.logo_image
      : " "}" width="67%" alt="Logo">
          </div>
          <div class="address">
            ${address.line1} ${address.line2} ${address.line3} ${address.city}, ${address.state} ${address.zip}, ${address.country}
        </div>
        </div>
        <h1>Payslip for The Month of ${monthName} ${salaryslip.year}</h1>
        <div class="details">
          <h3>Employee Details</h3>
          <table>
            <tr>
              <th>Emp Name</th>
              <td>${salaryslip.empname}</td>
              <th>PAN No.</th>
              <td>${salaryslip.pancard_No}</td>
            </tr>
            <tr>
              <th>Emp ID</th>
              <td>${salaryslip.employeeID}</td>
              <th>Gender</th>
              <td>${salaryslip.gender}</td>
            </tr>
            <tr>
              <th>Designation</th>
              <td>${salaryslip.designation}</td>
              <th>Bank A/c No.</th>
              <td>${salaryslip.account_no}</td>
            </tr>
            <tr>
              <th>Department</th>
              <td>${salaryslip.department}</td>
              <th>Pay Mode</th>
              <td>Bank</td>
            </tr>
            <tr>
              <th>Joining Date</th>
              <td>${salaryslip.date_of_joining}</td>
              <th>UAN</th>
              <td>123456789</td>
            </tr>
            <tr>
              <th>Total Leave</th>
              <td>${salaryslip.totalLeave}</td>
              <th>PF No.</th>
              <td>123456789</td>
            </tr>
            <tr>
              <th>Paid Leave</th>
              <td>${salaryslip.paidLeave}</td>
              <th>Number Of Days</th>
              <td>30</td>
            </tr>
            <tr>
              <th>Unpaid Leave</th>
              <td>${salaryslip.unpaidLeave}</td>
              <th>Gross Salary (Monthly)</th>
              <td>${salaryslip.totalGrossSalary}</td>
            </tr>
            <tr class="gap-row">
              <td colspan="4"></td>
            </tr>
            <tr>
              <th>Earnings</th>
              <th>Amount</th>
              <th>Deductions</th>
              <th>Amount</th>
            </tr>
            <tr>
              <th>Basic Salary</th>
              <td>${salaryslip.basicSalary}</td>
              <th>Present Days</th>
              <td>${salaryslip.presentDay}</td>
            </tr>
            <tr>
              <th>HRA</th>
              <td>${salaryslip.hra}</td>
              <th>Leave Deduction</th>
              <td>${salaryslip.leaveDeduction}</td>
            </tr>
            <tr>
              <th>DA</th>
              <td>${salaryslip.da}</td>
              <th>Miscellaneous Deduction</th>
              <td>0</td>
            </tr>
            <tr>
              <th>Transport Allowance</th>
              <td>${salaryslip.ta}</td>
              <th>Advance Salary</th>
              <td>${salaryslip.advanceSalary}</td>
            </tr>
            <tr>
              <th>Others</th>
              <td>${salaryslip.other}</td>
              <th>PF</th>
              <td>${salaryslip.pf}</td>
            </tr>
            <tr>
              <th>Bonus</th>
              <td>${salaryslip.bonus}</td>
              <th>ESI</th>
              <td>${salaryslip.esi}</td>
            </tr>
            <tr>
              <th>Gross Salary</th>
              <td>${salaryslip.grossSalary}</td>
              <th>Total Deductions (Monthly)</th>
              <td>${salaryslip.totaldeduction}</td>
            </tr>
            <tr>
              <th>Net Salary</th>
              <td colspan="3">${salaryslip.totalnetsalary}</td>
            </tr>
            <tr>
              <th>Net Salary in Words</th>
              <td colspan="3">${netSalaryInWords}</td>
            </tr>
          </table>
        </div>
        <div class="note">
          <p>Note: This pay slip is system-generated and verified by HR. No authorized seal is required. It reflects
            accurate details of your earnings and deductions for the specified period.</p>
          <p>If you have any queries regarding your pay, please reach out to the HR department for assistance.</p>
          <p>Note: This is a computer-generated statement and does not require authentication.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SalarySlip.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
