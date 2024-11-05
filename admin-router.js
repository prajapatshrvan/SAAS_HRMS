const adminauth = require("./routers/admin/adminAuth.router");
const role = require("./routers/admin/roleRouter");
const SalarySalb = require("./routers/admin/deduction.Router");
const documnetAddress = require("./routers/admin/documentAddress.router");

const adminApi = (app) => {
  app.use(adminauth);
  app.use("/admin", role);
  app.use(SalarySalb);
  app.use(documnetAddress);
};
module.exports = adminApi;
