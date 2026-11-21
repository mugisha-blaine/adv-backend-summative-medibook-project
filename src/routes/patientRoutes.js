const express = require("express");
const router = express.Router();
const controller = require("../controllers/patientController");
const validateId = require("../middleware/validateId");

router.post("/", controller.createPatient);
router.get("/", controller.getPatients);
router.get("/:id", validateId, controller.getPatient);
router.put("/:id", validateId, controller.updatePatient);
router.delete("/:id", validateId, controller.deletePatient);

module.exports = router;