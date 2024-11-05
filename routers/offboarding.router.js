const Offboarding = require("../controllers/offBoardingController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/offboarding/create", auth, Offboarding.createOffboarding);
router.get("/offboarding/view", auth, Offboarding.offboardingView);
router.post("/offboarding/status", auth, Offboarding.Status);
router.get("/offboarding/list", auth, Offboarding.offBoardingList);
router.post("/offboarding/delete", auth, Offboarding.offboardingDelete);

module.exports = router;
