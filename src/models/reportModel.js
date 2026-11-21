const db = require("../config/db");

exports.getDoctorStats = async () => {
    const [rows] = await db.execute(`
    SELECT
      d.id,
      d.name,
      d.specialty,
      COUNT(a.id) AS total_appointments,
      COUNT(CASE WHEN a.status = 'booked' THEN 1 END)
        AS active_appointments,
      COALESCE(SUM(a.fee_paid - a.refund_amount), 0)
        AS net_revenue,
      COUNT(CASE
        WHEN a.status = 'booked'
        AND a.appointment_time >= UTC_TIMESTAMP() + INTERVAL 2 HOUR
        AND a.appointment_time < DATE(UTC_TIMESTAMP() + INTERVAL 2 HOUR) + INTERVAL 7 DAY
        THEN 1
      END) AS upcoming_appointments
    FROM doctors d
    LEFT JOIN appointments a ON d.id = a.doctor_id
    GROUP BY d.id, d.name, d.specialty
    ORDER BY d.id
  `);

    return rows;
};


exports.getDailyReport = async () => {
  const [rows] = await db.execute(`
    SELECT
      d.id AS doctor_id,
      d.name AS doctor,
      DATE(a.appointment_time) AS appointment_date,
      COUNT(*) AS total_appointments,
      ROUND(COUNT(*) / 12 * 100, 2) AS utilization_percent
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.status = 'booked'
      AND a.appointment_time >= DATE(UTC_TIMESTAMP() + INTERVAL 2 HOUR)
      AND a.appointment_time < DATE(UTC_TIMESTAMP() + INTERVAL 2 HOUR)
          + INTERVAL 7 DAY
    GROUP BY d.id, d.name, DATE(a.appointment_time)
    ORDER BY appointment_date, d.name
  `);

  return rows;
};

exports.getBusyDays = async () => {
  const [rows] = await db.execute(`
    SELECT
      d.id AS doctor_id,
      d.name AS doctor,
      DATE(a.appointment_time) AS appointment_date,
      COUNT(*) AS total_appointments,
      ROUND(COUNT(*) / 12 * 100, 2) AS utilization_percent
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.status = 'booked'
    GROUP BY d.id, d.name, DATE(a.appointment_time)
    HAVING COUNT(*) > 12 * 0.80
    ORDER BY appointment_date, d.name
  `);

  return rows;
};

