const calculateRefund = (appointmentTime, fee, now = Date.now()) => {
    const appointmentDate = new Date(
        appointmentTime.replace(" ", "T") + "+02:00"
    );

    const hoursRemaining = (appointmentDate.getTime() - now) / 3600000;

    if (hoursRemaining > 48) {
        return Number(fee);
    }

    if (hoursRemaining >= 24) {
        return Number((Number(fee) * 0.5).toFixed(2));
    }

    return 0;
};

module.exports = calculateRefund;
