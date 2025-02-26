const user = require("./routers/user.router");
const adminrole = require("./routers/admin/roleRouter");
const leave = require("./routers/leave.router");
const employee = require("./routers/employee.router");
const location = require("./routers/location.router");
const asset = require("./routers/asset.router");
const AttendaceDashboard = require("./routers/dashboardAttendance.Router");

const holiday = require("./routers/holiday.router");
const resources = require("./routers/newresourcesRouter");
const action = require("./routers/actionRouter");
const notification = require("./routers/notificationRouter");
const logo = require("./routers/logo.router");

const docContent = require("./routers/docContent.router");
const generatedoc = require("./routers/generatedoc.router");
const managefund = require("./routers/managefund.router");
const offboarding = require("./routers/offboarding.router");
const advanSalary = require("./routers/advanceSalary.router");
const salary = require("./routers/salary.router");
const employeedashboard = require("./routers/employeeDashboard.router");
const hrdashboard = require("./routers/hrdashboad.router");
const headerAndfooter = require("./routers/header.footer.router");
const metaData = require("./routers/metadata.router");
const role = require("./routers/role.router");

const apiRouter = app => {
  app.use(user);
  app.use(adminrole);
  app.use(leave);
  app.use(employee);
  app.use(location);
  app.use(asset);
  app.use(AttendaceDashboard);
  app.use(metaData);
  app.use(holiday);
  app.use(resources);
  app.use(action);
  app.use(notification);
  app.use(managefund);
  app.use(logo);
  app.use(generatedoc);
  app.use(docContent);
  app.use(offboarding);
  app.use(advanSalary);
  app.use(salary);
  app.use(employeedashboard);
  app.use(hrdashboard);
  app.use(headerAndfooter);
  app.use(role);
};
module.exports = apiRouter;
