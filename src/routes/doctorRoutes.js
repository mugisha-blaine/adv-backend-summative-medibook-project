const express = require("express");
const router = express.Router();
const controller = require("../controllers/doctorController");
const validateId = require("../middleware/validateId");

router.post("/", controller.createDoctor);
router.get("/", controller.getDoctors);
router.get("/:id", validateId, controller.getDoctor);
router.put("/:id", validateId, controller.updateDoctor);
router.delete("/:id", validateId, controller.deleteDoctor);

module.exports = router;