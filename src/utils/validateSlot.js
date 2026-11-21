
const validateSlot = (appointment_time) => {
    if (typeof appointment_time !== "string") {
        return "Invalid appointment date";
    }

    const format = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/;

    if (!format.test(appointment_time)) {
        return "Use YYYY-MM-DD HH:mm:00 format";
    }

    const date = new Date(
        appointment_time.replace(" ", "T") + "+02:00"
    );

    if (isNaN(date.getTime())) {
        return "Invalid appointment date";
    }

    const localDate = new Date(date.getTime() + 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    if (localDate !== appointment_time) {
        return "Invalid appointment date";
    }

    if (date <= new Date()) {
        return "Appointment must be in the future";
    }

    const hour = Number(appointment_time.slice(11, 13));
    const minute = Number(appointment_time.slice(14, 16));

    if (hour < 9 || hour >= 17 || ![0, 30].includes(minute)) {
        return "Appointments must be between 09:00 and 17:00 in 30-minute slots";
    }

    return null;
};

module.exports = validateSlot;
