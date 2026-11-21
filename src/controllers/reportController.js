const Report = require("../models/reportModel");

exports.getDoctorStats = async (req, res, next) => {
    try {
        const stats = await Report.getDoctorStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
};


exports.getDailyReport = async (req, res, next) => {
    try {
        const report = await Report.getDailyReport();
        res.json(report);
    } catch (error) {
        next(error);
    }
};

exports.getBusyDays = async (req, res, next) => {
    try {
        const report = await Report.getBusyDays();
        res.json(report);
    } catch (error) {
        next(error);
    }
};
