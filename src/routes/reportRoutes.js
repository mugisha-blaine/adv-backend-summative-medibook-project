const express = require("express");
const router = express.Router();
const controller = require("../controllers/reportController");
const validateId = require("../middleware/validateId");

router.get("/doctors", controller.getDoctorStats);
router.get("/daily", controller.getDailyReport);
router.get("/busy-days", controller.getBusyDays);
router.get("/doctors/:id", validateId, controller.getDoctorDetails);

module.exports = router;
