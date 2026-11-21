
const Patient = require("../models/patientModel");

exports.createPatient = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name?.trim() || !email?.trim() || !phone?.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const id = await Patient.create(name.trim(), email.trim(), phone.trim());
        res.status(201).json({ id, name, email, phone });
    } catch (error) {
        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500)
            .json({ message: error.code === "ER_DUP_ENTRY" ? "Email already exists" : "Server error" });
    }
};

exports.getPatients = async (req, res) => {
    try {
        res.json(await Patient.getAll());
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getPatient = async (req, res) => {
    try {
        const patient = await Patient.getById(req.params.id);
        if (!patient) return res.status(404).json({ message: "Patient not found" });
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name?.trim() || !email?.trim() || !phone?.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const updated = await Patient.update(req.params.id, name.trim(), email.trim(), phone.trim());
        if (!updated) return res.status(404).json({ message: "Patient not found" });

        res.json({ message: "Patient updated successfully" });
    } catch (error) {
        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500)
            .json({ message: error.code === "ER_DUP_ENTRY" ? "Email already exists" : "Server error" });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const deleted = await Patient.remove(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Patient not found" });

        res.json({ message: "Patient deleted successfully" });
    } catch (error) {
        res.status(error.code === "ER_ROW_IS_REFERENCED_2" ? 409 : 500)
            .json({
                message: error.code === "ER_ROW_IS_REFERENCED_2"
                    ? "Cannot delete patient with appointments" : "Server error"
            });
    }
};
