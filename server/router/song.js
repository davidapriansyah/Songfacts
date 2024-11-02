const router = require("express").Router();
const songController = require("../controllers/songController");

router.get("/", songController.read);
router.get("/fact/:id", songController.readFact);

module.exports = router;
