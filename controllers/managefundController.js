const Employee = require("../models/Employee.model");
const Salary = require("../models/salaryModel.js");
const Holiday = require("../models/Holiday.model");  
const moment = require("moment");
const Attendance = require("../models/Attendance.model.js");
     
module.exports.payrolllist = async (req, res) => {
  try {
    const attendancelist = await Attendance.find().populate({
      path: "empid",
      select: "firstname middlename lastname employeeID image"
    });
    const employeeStatusCount = [];
    for (let index = 0; index < attendancelist.length; index++) {
      const element = attendancelist[index];
      if (element.empid) {
        const employeeFirstName = element.empid.firstname;
        const employeeMiddleName = element.empid.middlename;
        const employeeLastName = element.empid.lastname;
        const employeeId = element.empid.employeeID;
        const image = element.empid.image;
        const employeeName = `${employeeFirstName} ${employeeMiddleName} ${employeeLastName}`;
        const employeeKey = `${employeeId}`;
        const existingEmployeeIndex = employeeStatusCount.findIndex(
          emp =>
            emp.EmployeeName === employeeName && emp.EmployeeId === employeeKey
        );
        if (existingEmployeeIndex === -1) {
          employeeStatusCount.push({
            EmployeeName: employeeName,
            EmployeeId: employeeKey,
            image: image,
            "total days": element.status === true ? 1 : 0
          });
        } else {
          if (element.status === true) {
            employeeStatusCount[existingEmployeeIndex]["total days"]++;
          }
        }
      }
    }
    return res.status(200).json({
      employeeStatusCount
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.payrolllistView = async (req, res) => {
  try {
    const { empid } = req.query;
    if (!empid) {
      return res.status(400).json({ message: "invalid employee Id" });
    }
    const employee = await Attendance.findOne({
      empid: empid
    }).populate({
      path: "empid",
      select: "firstname middlename lastname employeeID"
    });
    return res.status(200).json({
      employee
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.countNetSalary = async (req, res) => {
  try {
    const countTotalSalary = await Employee.find();
    const totalmonthlyArray = countTotalSalary.map(
      employee => employee.ctcDetails.monthlycompensation
    );
    const numbersOnly = totalmonthlyArray
      .filter(value => typeof value === "string" && !isNaN(value))
      .map(Number);
    const sum = numbersOnly.reduce((total, num) => total + num, 0);
    const roundedSum = Math.round(sum * 2) / 2;
    return res.status(200).json({
      totalnetSalary: roundedSum
      // totalnetSalary: sum,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
 
module.exports.payrollcostandemployeepay = async (req, res) => {
  try {
    const countTotalSalary = await Employee.find();
    const totalctcArray = countTotalSalary.map(
      employee => employee.ctcDetails.monthlycompensation
    );
    const totalpf = countTotalSalary.map(employee => employee.ctcDetails.pf);
    const totalinsurance = countTotalSalary.map(
      employee => employee.ctcDetails.insurance
    );
    const totatax = countTotalSalary.map(employee => employee.ctcDetails.tax);
    const numbersOnly = totalctcArray
      .filter(value => typeof value === "string" && !isNaN(value))
      .map(Number);
    const onlypf = totalpf
      .filter(value => typeof value === "string" && !isNaN(value))
      .map(Number);
    const onlyinsurance = totalinsurance
      .filter(value => typeof value === "string" && !isNaN(value))
      .map(Number);
    const onlytax = totatax
      .filter(value => typeof value === "string" && !isNaN(value))
      .map(Number);
    const sum = numbersOnly.reduce((total, num) => total + num, 0);
    const roundedSum = Math.round(sum * 2) / 2;
    const pfSum = onlypf.reduce((total, num) => total + num, 0);
    const insuranceSum = onlyinsurance.reduce((total, num) => total + num, 0);
    const taxSum = onlytax.reduce((total, num) => total + num, 0);
    const employeenetpay = pfSum + insuranceSum + taxSum;
    const empnetpay = employeenetpay;
    return res.status(200).json({
      payrollCost: roundedSum,
      employeeNetpay: empnetpay
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.totalPayDays = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const totalDaysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

    let totalSundays = 0;
    const sundayDates = [];
    const holidayDates = [];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      if (date.getDay() === 0) {
        totalSundays++;
        sundayDates.push(moment(date).format("YYYY-MM-DD"));
      }
    }
    const {
      holiday_status,
      year = currentYear,
      country = "India",
      state = "Rajasthan"
    } = req.query;

    const query = { country, state, year };
    if (holiday_status) {
      query.holiday_status = holiday_status;
    }

    const holidaysInYear = await Holiday.find(query);
    let currentMonthHoliDays = 0;

    holidaysInYear.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getMonth() === currentMonth) {
        currentMonthHoliDays++;
        holidayDates.push(moment(holidayDate).format("YYYY-MM-DD"));
      }
    });

    const allHolidays = [...new Set([...sundayDates, ...holidayDates])];
    const totalWorkingDays = totalDaysInMonth - allHolidays.length;

    res.status(200).json({
      totalPayDays: totalWorkingDays,
      currentMonth: currentMonth + 1,
      currentYear: currentYear
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.manageFundDashboardStaticData = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Fetch employee count
    const countEmployee = await Employee.countDocuments({
      status: { $in: ["completed", "InNoticePeriod"] },
    });

    // Calculate total working days
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const sundayDates = Array.from({ length: totalDaysInMonth }, (_, day) => {
      const date = new Date(currentYear, currentMonth, day + 1);
      return date.getDay() === 0 ? moment(date).format("YYYY-MM-DD") : null;
    }).filter(Boolean);

    const {
      holiday_status,
      year = currentYear,
      country = "India",
      state = "Rajasthan",
    } = req.query;

    const holidayQuery = {
      country,
      state,
      year,
      ...(holiday_status && { holiday_status }),
    };

    const holidaysInYear = await Holiday.find(holidayQuery, "date");
    const holidayDates = holidaysInYear
      .map((holiday) => holiday.date)
      .filter((date) => new Date(date).getMonth() === currentMonth)
      .map((date) => moment(date).format("YYYY-MM-DD"));

    const uniqueHolidays = new Set([...sundayDates, ...holidayDates]);
    const totalWorkingDays = totalDaysInMonth - uniqueHolidays.size;

    // Calculate total net salary
    const employees = await Employee.find({}, "ctcDetails.monthlycompensation");
    const totalNetSalary = employees.reduce((sum, { ctcDetails }) => {
      const monthlyComp = parseFloat(ctcDetails?.monthlycompensation);
      return sum + (isNaN(monthlyComp) ? 0 : monthlyComp);
    }, 0).toFixed(2);

    const salaries = await Salary.find({
      month: { $lte: currentMonth + 1 },
      year: { $lte: currentYear },
    });

    const monthlyData = salaries.reduce(
      (acc, salary) => {
        const month = salary.month.toString().padStart(2, "0");
        acc.costs[month] += parseFloat(salary.monthlyAmount) || 0;
        acc.taxes[month] += parseFloat(salary.totalTax) || 0;
        acc.deductions[month] += parseFloat(salary.totalDeductions) || 0;
        return acc;
      },
      {
        costs: Array(12).fill(0),
        taxes: Array(12).fill(0),
        deductions: Array(12).fill(0),
      }
    );

    const formatMonthlyData = (data) => data.map((value) => value.toFixed(2));

    const costSummary = {
      series: [
        { name: "Net Pay", data: formatMonthlyData(monthlyData.costs) },
        { name: "Taxes", data: formatMonthlyData(monthlyData.taxes) },
        { name: "Deduction", data: formatMonthlyData(monthlyData.deductions) },
      ],
    };

    // Payroll summary
    const payrollSummary = await Salary.aggregate([
      {
        $match: {
          month: String(currentMonth + 1).padStart(2, "0"),
          year: currentYear.toString(),
        },
      },
      {
        $group: {
          _id: "$payment_status",
          totalAmount: { $sum: "$monthlyAmount" },
        },
      },
    ]);

    const payrollSummaryData = payrollSummary.reduce(
      (acc, { _id, totalAmount }) => {
        if (_id === true) acc.paid += totalAmount;
        else acc.pending += totalAmount;
        acc.payment += totalAmount;
        return acc;
      },
      { payment: 0, pending: 0, paid: 0 }
    );

    return res.status(200).json({
      countEmployee,
      totalWorkingDays,
      totalNetSalary,
      costSummary,
      payrollSummaryData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
