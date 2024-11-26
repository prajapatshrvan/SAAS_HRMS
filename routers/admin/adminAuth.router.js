const adminController = require("../../controllers/admin/adminAuthControlers");
const { auth } = require("../../middleware/AdminauthMiddleware");

const router = require("express").Router();
router.get("/login", adminController.login);
router.get("/dashboard", adminController.dashboard);
router.post("/admin/login", adminController.Adminlogin);

// router.get("/dashboard", auth, adminController.AdminDashboard);
router.post("/logout", auth, adminController.logout);

module.exports = router;
