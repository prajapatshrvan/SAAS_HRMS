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
    let deductedCfLeave = 0;

    // Increase CF leave by 1
    cfLeave += 1;

    if (absent > 0) {
      if (cfLeave >= absent) {
        deductedCfLeave = absent;
        cfLeave -= absent;
        remainingAbsent = 0;
      } else {
        deductedCfLeave = cfLeave;
        remainingAbsent -= cfLeave;
        cfLeave = 0;
      }
    }

    await Employee.findByIdAndUpdate(empid, { cf: cfLeave }, { new: true });

    return {
      updatedCfLeave: cfLeave,
      deductedCfLeave,
      remainingAbsent
    };
  } catch (error) {
    console.error("Error in leave carry forward:", error.message);
    throw error;
  }
};

const calculateSalaryComponents = totalPaidAmount => {
  const basicSalary = (totalPaidAmount * 30 / 100).toFixed(2);
  // const hra = totalPaidAmount * 25 / 100;
  //  const ta = totalPaidAmount * 10 / 100;
  //  const da = totalPaidAmount * 10 / 100;
  // const other = totalPaidAmount * 25 / 100;

  return {
    basicSalary: parseFloat(basicSalary)
    // hra: parseFloat(hra.toFixed(2)),
    //  ta: parseFloat(ta.toFixed(2)),
    //  da: parseFloat(da.toFixed(2)),
    // other: parseFloat(other.toFixed(2))
  };
};

function countSundaysAndHolidays(startDate, endDate, holidays, Present) {
  if (Present === 0) {
    return 0;
  }

  let start = new Date(startDate);
  let end = new Date(endDate);
  let count = 0;

  let holidayDates = new Set(
    holidays.map(date => new Date(date.date).toDateString())
  );

  let allDates = new Set();

  while (start <= end) {
    let currentDate = start.toDateString();

    // Check if it's a Sunday
    if (start.getDay() === 0 && !allDates.has(currentDate)) {
      count++;
      allDates.add(currentDate);
    }

    // Check if it's a holiday
    if (holidayDates.has(currentDate) && !allDates.has(currentDate)) {
      count++;
      allDates.add(currentDate);
    }

    start.setDate(start.getDate() + 1);
  }

  return count;
}

const createSalary = async (req, res) => {
  try {
    const Year = moment().format("YYYY");
    const Month = moment().format("MM");

    // Check if salary already exists
    const existingSalary = await Salary.findOne({
      month: Month,
      year: Year
    }).lean();
    if (existingSalary) {
      return res
        .status(400)
        .json({ message: `Salary for ${Month}-${Year} Already Created.` });
    }

    const employees = await Employee.find({ status: "completed" }).lean();
    if (!employees.length) {
      return res
        .status(404)
        .json({ message: "No employees found for salary processing." });
    }

    const startDate = moment(`${Year}-${Month}-26`)
      .subtract(1, "month")
      .startOf("day");
    // .toDate();
    const endDate = moment(`${Year}-${Month}-25`).endOf("day");
    // .toDate();

    // const totalDaysInCurrentMonth = moment(`${Year}-${Month}`).daysInMonth();

    const totalDaysInCurrentMonth = endDate.diff(startDate, "days") + 1;

    const monthdays = totalDaysInCurrentMonth;

    // Fetch all attendance records for relevant employees in one go
    const employeeIds = employees.map(emp => emp._id);
    const attendanceRecords = await Attendance.find({
      empid: { $in: employeeIds },
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Organize attendance by employee
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      if (!attendanceMap[record.empid]) {
        attendanceMap[record.empid] = {
          absent: 0,
          full_leave: 0,
          half_leave: 0,
          present: 0
        };
      }
      attendanceMap[record.empid][record.status] =
        (attendanceMap[record.empid][record.status] || 0) + 1;
    });

    const salaries = [];

    const holiday = await Holiday.find({
      holiday_status: "approved",
      date: { $gt: startDate, $lt: endDate }
    }).sort({ date: -1 });

    for (const emp of employees) {
      const empAttendance = attendanceMap[emp._id] || {
        absent: 0,
        full_leave: 0,
        half_leave: 0,
        present: 0
      };

      // Calculate total absent days
      const totalAbsent =
        empAttendance.absent +
        empAttendance.full_leave +
        empAttendance.half_leave / 2;

      const joiningDate = emp.joining_date ? new Date(emp.joining_date) : null;
      const STARTDATE =
        joiningDate &&
        !isNaN(joiningDate) &&
        (joiningDate.getMonth() === new Date().getMonth() &&
          joiningDate.getFullYear() === new Date().getFullYear())
          ? joiningDate
          : startDate;

      const sundaysAndHolidays = countSundaysAndHolidays(
        STARTDATE,
        endDate,
        holiday,
        empAttendance.present
      );

      // Handle leave carry forward
      const { remainingAbsent, deductedCfLeave } = await leave_carry_forward(
        emp._id,
        totalAbsent
      );

      const workingDayCount =
        empAttendance.present +
        (empAttendance.half_leave
          ? parseFloat(empAttendance.half_leave / 2)
          : 0);

      const totalPaidDays =
        sundaysAndHolidays + workingDayCount + deductedCfLeave;

      const remainingDays = parseFloat(monthdays - remainingAbsent);

      if (!emp.ctcDetails || !parseFloat(emp.ctcDetails.monthlycompensation)) {
        // console.error(`Skipping employee ${emp._id}: Missing salary details`);
        continue;
      }

      const totalGrossSalary =
        parseFloat(
          String(emp.ctcDetails.monthlycompensation).replace(/,/g, ""),
          10
        ) || 0;

      const perDaySalary = (totalGrossSalary / monthdays).toFixed(2);
      const leaveDeduction = (perDaySalary * remainingAbsent).toFixed(2);
      const totalPaidAmount = (totalPaidDays * perDaySalary).toFixed(2);

      // Salary Component Calculation
      const { basicSalary } = calculateSalaryComponents(totalPaidAmount);
      const pf = (totalPaidAmount * 0.3 * 0.24).toFixed(2);
      let esi =
        totalGrossSalary < 21000 ? (totalPaidAmount * 0.04).toFixed(2) : 0;
      let netSalary = parseFloat(
        totalPaidAmount - (parseFloat(pf) + parseFloat(esi))
      ).toFixed();
      netSalary = isNaN(netSalary) ? 0 : netSalary;

      const advanceSalary = await AdvanceSalary.findOne({
        empid: emp._id,
        status: "pending"
      }).lean();
      let advanceDeduction = 0;

      if (advanceSalary) {
        advanceDeduction = advanceSalary.emi_amount || 0;
        netSalary -= advanceDeduction;

        advanceSalary.instalment -= 1;
        advanceSalary.paidAmount += advanceDeduction;

        if (advanceSalary.instalment < 1) {
          advanceSalary.status = "completed";
        }

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

      // const cfremaining = await Leave.findOne({ empid: emp._id }).lean().then(balance => balance?.cfremaining || 0);
      const totalDeduction = (parseFloat(pf) +
        parseFloat(esi) +
        parseFloat(leaveDeduction) +
        parseFloat(advanceDeduction)).toFixed(2);

      // Push salary data
      salaries.push({
        empid: emp._id,
        empname: `${emp.firstname} ${emp.middlename} ${emp.lastname}`,
        employeeID: emp.employeeID,
        designation: emp.designation,
        department: emp.department,
        date_of_joining: new Date(emp.joining_date).toLocaleDateString(),
        pancard_No: emp.pancard_no,
        account_no: parseInt(emp.bankdetails.account_no),
        gender: emp.gender,
        date: new Date(),
        month: parseInt(Month),
        year: parseInt(Year),
        salary_status: "pending",
        payment_status: false,
        totalCTC:
          parseFloat(
            String(emp.ctcDetails.totalctc || "").replace(/,/g, ""),
            10
          ) || 0,
        basicSalary: parseFloat(basicSalary) || 0,
        hra: 0,
        ta: 0,
        da: 0,
        other: 0,
        paydays: parseInt(totalPaidDays),
        pf: parseFloat(pf) || 0,
        esi: parseFloat(esi) || 0,
        countPardaysalary: perDaySalary || 0,
        remainingDays: remainingDays,
        presentDay: totalPaidDays,
        totalLeave: totalAbsent || 0,
        unpaidLeave: remainingAbsent,
        netSalary: netSalary,
        grossSalary: totalPaidAmount,
        totalGrossSalary: totalGrossSalary.toFixed(2),
        totalnetsalary: netSalary,
        leaveDeduction: leaveDeduction || 0,
        advanceSalary: advanceDeduction || 0,
        miscellaneous: 0,
        totaldeduction: totalDeduction || 0
      });
    }

    // Insert all salaries at once
    await Salary.insertMany(salaries);

    return res.status(200).json({ message: "Salaries created successfully" });
  } catch (error) {
    console.error("Error creating salaries:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createSalary
};

const getDaysCount = (month, year) => {
  let startDate = new Date(year, month - 1, 26);
  let endDate = new Date(year, month, 25);
  const timeDifference = endDate - startDate;
  const dayCount = timeDifference / (1000 * 60 * 60 * 24) + 1;

  return dayCount;
};

module.exports.salaryList = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Please provide both month and year" });
    }

    let salaryList;
    if (["ADMIN", "SUPERADMIN", "HR"].includes(req.role_name)) {
      salaryList = await Salary.find({
        month: parseInt(month),
        year: parseInt(year)
      }).populate({
        path: "empid",
        select: "firstname lastname employeeID image"
      });
    } else {
      salaryList = await Salary.find({
        empid: req.user.userObjectId,
        month: parseInt(month),
        year: parseInt(year)
      }).populate({
        path: "empid",
        select: "firstname lastname employeeID image"
      });
    }

    const newData = salaryList.map(salary => {
      const { empid, ...rest } = salary.toObject();
      return empid
        ? {
            ...rest,
            employee_name: `${empid.firstname} ${empid.lastname}`,
            empid: empid._id,
            employeeID: empid.employeeID,
            image: empid.image
          }
        : {
            ...rest,
            employee_name: "Unknown",
            empid: null,
            employeeID: "Unknown",
            image: "Unknown"
          };
    });

    const totalEmployee = salaryList.length;
    const totalPaid = salaryList.reduce((prev, paid) => {
      return prev + paid.totalnetsalary;
    }, 0);
    const totalUnPaid = salaryList.reduce((prev, paid) => {
      return prev + paid.totaldeduction;
    }, 0);
    // Example Usage
    const workingDays = getDaysCount(month, year);

    return res.status(200).json({
      SalaryList: newData,
      totalEmployee,
      totalPaid,
      totalUnPaid,
      workingDays
    });
  } catch (error) {
    console.error("Error fetching salary list:", error);
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
          $set: {
            payment_status: true,
            salary_status: "paid",
            pay_date: new Date()
          }
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
              <td>${salaryslip.paydays}</td>
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
              <th>Gross Salary </th>
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
