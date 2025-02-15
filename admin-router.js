const adminauth = require("./routers/admin/adminAuth.router");
const role = require("./routers/admin/roleRouter");
const SalarySalb = require("./routers/admin/deduction.Router");
const documnetAddress = require("./routers/admin/documentAddress.router");
const metaData = require("./routers/admin/metadataRouter");
const company = require("./routers/admin/company.router");

const adminApi = app => {
  app.use(adminauth);
  app.use(role);
  app.use(SalarySalb);
  app.use(documnetAddress);
  app.use(metaData);
  app.use(company);
};
module.exports = adminApi;
