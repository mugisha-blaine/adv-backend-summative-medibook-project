
const Doctor = require("../models/doctorModel");

const validDoctor = ({ name, specialty, consultation_fee, room }) =>
    typeof name === "string" && name.trim() &&
    typeof specialty === "string" && specialty.trim() &&
    typeof room === "string" && room.trim() &&
    typeof consultation_fee === "number" &&
    Number.isFinite(consultation_fee) && consultation_fee >= 0;

exports.createDoctor = async (req, res) => {
    try {
        if (!validDoctor(req.body)) {
            return res.status(400).json({ message: "Invalid doctor details" });
        }

        const { name, specialty, consultation_fee, room } = req.body;
        const id = await Doctor.create(name.trim(), specialty.trim(), consultation_fee, room.trim());

        res.status(201).json({ id, name, specialty, consultation_fee, room });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        res.json(await Doctor.getAll());
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.getById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        if (!validDoctor(req.body)) {
            return res.status(400).json({ message: "Invalid doctor details" });
        }

        const { name, specialty, consultation_fee, room } = req.body;
        const updated = await Doctor.update(
            req.params.id, name.trim(), specialty.trim(), consultation_fee, room.trim()
        );

        if (!updated) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json({ message: "Doctor updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const deleted = await Doctor.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
        res.status(error.code === "ER_ROW_IS_REFERENCED_2" ? 409 : 500).json({
            message: error.code === "ER_ROW_IS_REFERENCED_2"
                ? "Cannot delete doctor with appointments"
                : "Server error"
        });
    }
};
