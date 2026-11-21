
const Appointment = require("../models/appointmentModel");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const validateSlot = require("../utils/validateSlot");

exports.bookAppointment = async (req, res, next) => {
    try {
        const { patient_id, doctor_id, appointment_time } = req.body;

        if (!Number.isSafeInteger(patient_id) || patient_id <= 0 ||
            !Number.isSafeInteger(doctor_id) || doctor_id <= 0) {
            return res.status(400).json({
                message: "Valid patient and doctor IDs are required"
            });
        }

        const error = validateSlot(appointment_time);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const patient = await Patient.getById(patient_id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const doctor = await Doctor.getById(doctor_id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const id = await Appointment.create(
            patient_id,
            doctor_id,
            appointment_time,
            doctor.consultation_fee
        );

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment: {
                id,
                patient_id,
                doctor_id,
                appointment_time,
                status: "booked",
                fee_paid: doctor.consultation_fee
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.getAll();
        res.json(appointments);
    } catch (error) {
        next(error);
    }
};
