const Documnet = require("../controllers/generatedocController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.get("/employeedetails", auth, Documnet.findEmpByEmail);
router.post("/create/document", auth, Documnet.createDocument);
router.get("/generate/documnet/:id/:document", Documnet.generateDocument);
router.post("/approved/documnet", auth, Documnet.approvedStatus);
router.get("/view/documnet/:id/:document", Documnet.viewDocument);
router.get("/document/list", auth, Documnet.List);

module.exports = router;
