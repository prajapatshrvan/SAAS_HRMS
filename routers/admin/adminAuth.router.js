const adminController = require("../../controllers/admin/adminAuthControlers");
const { auth } = require("../../middleware/AdminauthMiddleware");

const router = require("express").Router();
router.get("/admin/login", adminController.login);
router.post("/admin/login", adminController.Adminlogin);
router.get("/dashboard", auth, adminController.AdminDashboard);
router.post("/admin/logout", auth, adminController.logout);

module.exports = router;
