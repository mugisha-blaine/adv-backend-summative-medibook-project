
const Appointment = require("../models/appointmentModel");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const redis = require("../config/redis");
const validateSlot = require("../utils/validateSlot");
const auditLogger = require("../utils/auditLogger");

exports.bookAppointment = async (req, res, next) => {
    try {
        const { patient_id, doctor_id, appointment_time } = req.body || {};

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

        const booking = await Appointment.create(
            patient_id,
            doctor_id,
            appointment_time,
        );

        void auditLogger("BOOKING_CREATED", {
            appointment_id: booking.id,
            patient_id,
            doctor_id,
            appointment_time
        });

        try {
            await redis.rPush("notifications:pending", JSON.stringify({
                patient_id,
                appointment_id: booking.id
            }));
        } catch (error) {
            console.error("Notification queue failed:", error.message);
        }

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment: {
                id: booking.id,
                patient_id,
                doctor_id,
                appointment_time,
                status: "booked",
                fee_paid: booking.fee_paid
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


exports.cancelAppointment = async (req, res, next) => {
    try {
        const result = await Appointment.cancel(req.params.id);

        void auditLogger("APPOINTMENT_CANCELLED", {
            appointment_id: result.id,
            refund_amount: result.refund_amount
        });

        res.json({
            message: "Appointment cancelled successfully",
            ...result
        });
    } catch (error) {
        next(error);
    }
};


exports.joinWaitlist = async (req, res, next) => {
    try {
        const { patient_id, doctor_id, appointment_time } = req.body || {};

        if (!Number.isSafeInteger(patient_id) || patient_id <= 0 ||
            !Number.isSafeInteger(doctor_id) || doctor_id <= 0) {
            return res.status(400).json({ message: "Invalid patient or doctor ID" });
        }

        const error = validateSlot(appointment_time);
        if (error) return res.status(400).json({ message: error });

        const patient = await Patient.getById(patient_id);
        const doctor = await Doctor.getById(doctor_id);

        if (!patient || !doctor) {
            return res.status(404).json({ message: "Patient or doctor not found" });
        }

        const unavailable = await Appointment.isUnavailable(
            doctor_id, appointment_time
        );

        if (!unavailable) {
            return res.status(409).json({
                message: "This slot is available. Book it directly."
            });
        }

        if (!redis.isReady) {
            return res.status(503).json({ message: "Waitlist service unavailable" });
        }

        const key = `waitlist:${doctor_id}:${appointment_time.replace(" ", "T")}`;
        const queue = await redis.lRange(key, 0, -1);

        if (queue.some((item) => JSON.parse(item).patient_id === patient_id)) {
            return res.status(409).json({
                message: "Patient is already on this waitlist"
            });
        }

        await redis.rPush(key, JSON.stringify({
            patient_id,
            doctor_id,
            appointment_time
        }));

        res.status(201).json({
            message: "Patient added to waitlist",
            position: queue.length + 1
        });
    } catch (error) {
        next(error);
    }
};
