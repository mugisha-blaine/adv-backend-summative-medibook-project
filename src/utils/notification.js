
const auditLogger = require("./auditLogger");

const sendNotification = async (patientId, appointmentId) => {
  const message = `Patient ${patientId}, your appointment ${appointmentId} is confirmed.`;

  console.log("Simulated SMS/Email:", message);

  await auditLogger("NOTIFICATION_SENT", {
    patient_id: patientId,
    appointment_id: appointmentId,
    message,
    simulated: true
  }, true);
};

module.exports = sendNotification;
