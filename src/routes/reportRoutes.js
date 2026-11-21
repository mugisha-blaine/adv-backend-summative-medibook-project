const express = require("express");
const router = express.Router();
const controller = require("../controllers/reportController");

router.get("/doctors", controller.getDoctorStats);
router.get("/daily", controller.getDailyReport);
router.get("/busy-days", controller.getBusyDays);

module.exports = router;
