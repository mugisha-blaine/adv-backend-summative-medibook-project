const db = require("../config/db");
const calculateRefund = require("../utils/calculateRefund");

exports.create = async (patientId, doctorId, appointmentTime) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the doctor to prevent simultaneous booking conflicts.
        const [doctors] = await connection.execute(
            "SELECT consultation_fee FROM doctors WHERE id = ? FOR UPDATE",
            [doctorId]
        );

        if (!doctors.length) {
            throw { status: 404, message: "Doctor not found" };
        }

        const [patients] = await connection.execute(
            "SELECT id FROM patients WHERE id = ?",
            [patientId]
        );

        if (!patients.length) {
            throw { status: 404, message: "Patient not found" };
        }

        const date = appointmentTime.slice(0, 10);

        const [rows] = await connection.execute(
            `SELECT COUNT(*) AS total
       FROM appointments
       WHERE doctor_id = ?
         AND status = 'booked'
         AND appointment_time >= ?
         AND appointment_time < DATE_ADD(?, INTERVAL 1 DAY)`,
            [doctorId, date, date]
        );

        if (rows[0].total >= 12) {
            throw {
                status: 409,
                message: "Doctor has reached the daily limit of 12 appointments"
            };
        }

        const fee = doctors[0].consultation_fee;

        const [result] = await connection.execute(
            `INSERT INTO appointments
       (patient_id, doctor_id, appointment_time, fee_paid)
       VALUES (?, ?, ?, ?)`,
            [patientId, doctorId, appointmentTime, fee]
        );

        await connection.commit();

        return {
            id: result.insertId,
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_time: appointmentTime,
            status: "booked",
            fee_paid: fee
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.getAll = async () => {
    const [rows] = await db.execute(
        `SELECT a.id, p.name AS patient, d.name AS doctor,
            a.appointment_time, a.status,
            a.fee_paid, a.refund_amount, a.cancelled_at
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     ORDER BY a.appointment_time`
    );

    return rows;
};

exports.cancel = async (id) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Identify the doctor before locking rows.
        const [existing] = await connection.execute(
            "SELECT doctor_id FROM appointments WHERE id = ?",
            [id]
        );

        if (!existing.length) {
            throw { status: 404, message: "Appointment not found" };
        }

        // Lock doctor first, maintaining consistent lock order.
        const doctorId = existing[0].doctor_id;

        await connection.execute(
            "SELECT id FROM doctors WHERE id = ? FOR UPDATE",
            [doctorId]
        );

        const [rows] = await connection.execute(
            "SELECT * FROM appointments WHERE id = ? FOR UPDATE",
            [id]
        );

        const appointment = rows[0];

        if (appointment.status === "cancelled") {
            throw {
                status: 409,
                message: "Appointment is already cancelled"
            };
        }

        const refund = calculateRefund(
            appointment.appointment_time,
            appointment.fee_paid
        );

        const cancelledAt = new Date(Date.now() + 7200000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

        await connection.execute(
            `UPDATE appointments
       SET status = 'cancelled',
           refund_amount = ?,
           cancelled_at = ?
       WHERE id = ?`,
            [refund, cancelledAt, id]
        );

        await connection.commit();

        return {
            id,
            status: "cancelled",
            fee_paid: appointment.fee_paid,
            refund_amount: refund
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};


exports.isUnavailable = async (doctorId, appointmentTime) => {
    const date = appointmentTime.slice(0, 10);

    const [rows] = await db.execute(
        `SELECT COUNT(*) AS daily_total,
       SUM(appointment_time = ?) AS slot_total
     FROM appointments
     WHERE doctor_id = ?
       AND status = 'booked'
       AND appointment_time >= ?
       AND appointment_time < DATE_ADD(?, INTERVAL 1 DAY)`,
        [appointmentTime, doctorId, date, date]
    );

    return rows[0].daily_total >= 12 || rows[0].slot_total > 0;
};

