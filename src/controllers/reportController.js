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


exports.getDoctorDetails = async (req, res, next) => {
    try {
        const report = await Report.getDoctorDetails(req.params.id);

        if (!report) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        res.json(report);
    } catch (error) {
        next(error);
    }
};

