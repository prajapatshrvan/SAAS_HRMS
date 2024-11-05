const router = require("express").Router();
const City = require("../controllers/locationController");

router.get("/city/:id", City.city);
router.get("/country", City.country);
router.get("/state/:id", City.state);
router.get("/statename/:country_name", City.state_name);

module.exports = router;
