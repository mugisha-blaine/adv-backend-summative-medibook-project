
const express = require("express");
const router = express.Router();
const controller = require("../controllers/appointmentController");
const validateId = require("../middleware/validateId");

router.post("/", controller.bookAppointment);
router.get("/", controller.getAppointments);
router.patch("/:id/cancel", validateId, controller.cancelAppointment);

module.exports = router;
