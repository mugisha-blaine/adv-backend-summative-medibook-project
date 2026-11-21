const express = require("express");
const router = express.Router();
const controller = require("../controllers/reportController");

router.get("/doctors", controller.getDoctorStats);

module.exports = router;
