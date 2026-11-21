
const db = require("../config/db");

exports.create = async (patientId, doctorId, appointmentTime, fee) => {
  const [result] = await db.execute(
    `INSERT INTO appointments
    (patient_id, doctor_id, appointment_time, fee_paid)
    VALUES (?, ?, ?, ?)`,
    [patientId, doctorId, appointmentTime, fee]
  );

  return result.insertId;
};

exports.getAll = async () => {
  const [rows] = await db.execute(
    `SELECT a.id, p.name AS patient, d.name AS doctor,
            a.appointment_time, a.status, a.fee_paid
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     ORDER BY a.appointment_time`
  );

  return rows;
};
