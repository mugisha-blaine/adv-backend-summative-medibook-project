
const Patient = require("../models/patientModel");

exports.createPatient = async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof phone !== "string" || !phone.trim()
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const patientName = name.trim();
        const patientEmail = email.trim();
        const patientPhone = phone.trim();

        const id = await Patient.create(patientName, patientEmail, patientPhone);

        res.status(201).json({
            id,
            name: patientName,
            email: patientEmail,
            phone: patientPhone
        });
    } catch (error) {
        next(error);
    }
};

exports.getPatients = async (req, res, next) => {
    try {
        const patients = await Patient.getAll();
        res.json(patients);
    } catch (error) {
        next(error);
    }
};

exports.getPatient = async (req, res, next) => {
    try {
        const patient = await Patient.getById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.json(patient);
    } catch (error) {
        next(error);
    }
};

exports.updatePatient = async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof phone !== "string" || !phone.trim()
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const updated = await Patient.update(
            req.params.id,
            name.trim(),
            email.trim(),
            phone.trim()
        );

        if (!updated) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.json({ message: "Patient updated successfully" });
    } catch (error) {
        next(error);
    }
};

exports.deletePatient = async (req, res, next) => {
    try {
        const deleted = await Patient.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.json({ message: "Patient deleted successfully" });
    } catch (error) {
        next(error);
    }
};
