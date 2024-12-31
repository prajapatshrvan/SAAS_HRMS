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

// module.exports.manageFundDashboardStaticData = async (req, res) => {
//   try {
//     const countEmployee = await Employee.countDocuments({
//       $or: [{ status: "completed" }, { status: "InNoticePeriod" }]
//     });

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth();
//     const totalDaysInMonth = new Date(
//       currentYear,
//       currentMonth + 1,
//       0
//     ).getDate();

//     const sundayDates = [];
//     for (let day = 1; day <= totalDaysInMonth; day++) {
//       const date = new Date(currentYear, currentMonth, day);
//       if (date.getDay() === 0) {
//         sundayDates.push(moment(date).format("YYYY-MM-DD"));
//       }
//     }

//     const { holiday_status, year, country, state } = req.query;
//     const defaultYear = year || currentYear;
//     const defaultCountry = country || "India";
//     const defaultState = state || "Rajasthan";

//     const holidayQuery = {
//       country: defaultCountry,
//       state: defaultState,
//       year: defaultYear
//     };

//     if (holiday_status) {
//       holidayQuery.holiday_status = holiday_status;
//     }

//     const holidaysInYear = await Holiday.find(holidayQuery);
//     const holidayDates = [];

//     holidaysInYear.forEach(result => {
//       if (new Date(result.date).getMonth() === currentMonth) {
//         holidayDates.push(moment(result.date).format("YYYY-MM-DD"));
//       }
//     });

//     console.log(holidayDates);

//     const holidays = [...sundayDates, ...holidayDates];
//     const uniqueHolidays = [...new Set(holidays)];
//     const totalWorkingDays = totalDaysInMonth - uniqueHolidays.length;

//     // NetSalary
//     const countTotalSalary = await Employee.find();
//     const totalmonthlyArray = countTotalSalary.map(
//       employee => employee.ctcDetails.monthlycompensation
//     );
//     const numbersOnly = totalmonthlyArray
//       .filter(value => typeof value === "string" && !isNaN(value))
//       .map(Number);
//     const sum = numbersOnly.reduce((total, num) => total + num, 0);
//     const roundedSum = sum.toFixed(2);

//     // Fetch salaries
//     const salaries = await Salary.find({
//       month: { $lte: currentMonth + 1 },
//       year: { $lte: currentYear }
//     });

//     console.log(salaries, "salaries");

//     const monthlyCosts = {};
//     const monthlyTax = {};
//     const monthlyDeduction = {};

//     salaries.forEach(salary => {
//       const month = salary.month.toString().padStart(2, "0");
//       monthlyCosts[month] =
//         (monthlyCosts[month] || 0) + (parseFloat(salary.monthlyAmount) || 0);
//       monthlyTax[month] =
//         (monthlyTax[month] || 0) + (parseFloat(salary.totalTax) || 0);
//       monthlyDeduction[month] =
//         (monthlyDeduction[month] || 0) +
//         (parseFloat(salary.totalDeductions) || 0);
//     });

//     const reducedMonthlyCosts = {};
//     for (const [month, amount] of Object.entries(monthlyCosts)) {
//       reducedMonthlyCosts[month] = amount.toFixed(2);
//     }

//     const reducedMonthlyTax = {};
//     for (const [month, amount] of Object.entries(monthlyTax)) {
//       reducedMonthlyTax[month] = amount.toFixed(2);
//     }

//     const reducedMonthlyDeduction = {};
//     for (const [month, amount] of Object.entries(monthlyDeduction)) {
//       reducedMonthlyDeduction[month] = amount.toFixed(2);
//     }

//     const months = [
//       "01",
//       "02",
//       "03",
//       "04",
//       "05",
//       "06",
//       "07",
//       "08",
//       "09",
//       "10",
//       "11",
//       "12"
//     ];
//     const netPayData = months.map(
//       month => reducedMonthlyCosts[month] || "0.00"
//     );
//     const taxesData = months.map(month => reducedMonthlyTax[month] || "0.00");
//     const deductionsData = months.map(
//       month => reducedMonthlyDeduction[month] || "0.00"
//     );

//     const costSummer = {
//       series: [
//         {
//           name: "Net Pay",
//           data: netPayData
//         },
//         {
//           name: "Taxes",
//           data: taxesData
//         },
//         {
//           name: "Deduction",
//           data: deductionsData
//         }
//       ]
//     };

//     const currentD = new Date();
//     const currentM = String(currentD.getMonth() + 1).padStart(2, "0");
//     const currentY = currentD.getFullYear();

//     const payrollSummary = await Salary.find({
//       month: currentM,
//       year: currentY.toString()
//     });
//     const monthlyAmounts = [];
//     payrollSummary.forEach(salary => {
//       monthlyAmounts.push(parseFloat(salary.monthlyAmount));
//     });
//     const totalMonthlyAmount = monthlyAmounts.reduce(
//       (total, amount) => total + amount,
//       0
//     );

//     const payrollSummary1 = await Salary.find({
//       month: currentM,
//       year: currentY.toString(),
//       payment_status: false
//     });

//     const monthlyAmountsPaid = payrollSummary1.map(salary =>
//       parseFloat(salary.monthlyAmount)
//     );

//     const totalMonthlyAmountPaid = monthlyAmountsPaid.reduce(
//       (total, amount) => total + amount,
//       0
//     );

//     const payrollSummary2 = await Salary.find({
//       month: currentM,
//       year: currentY.toString(),
//       payment_status: true
//     });

//     const monthlyAmountsPaid1 = payrollSummary2.map(salary =>
//       parseFloat(salary.monthlyAmount)
//     );
//     const totalMonthlyAmountPaid1 = monthlyAmountsPaid1.reduce(
//       (total, amount) => total + amount,
//       0
//     );

//     const payrollSummarydata = {
//       payment: totalMonthlyAmount,
//       pending: totalMonthlyAmountPaid,
//       Paid: totalMonthlyAmountPaid1
//     };

//     return res.status(200).json({
//       Count: countEmployee,
//       totalWorkingDays: totalWorkingDays,
//       totalnetSalary: roundedSum,
//       costSummer: costSummer,
//       payrollSummarydata
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: "Internal Server Error"
//     });
//   }
// };

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
