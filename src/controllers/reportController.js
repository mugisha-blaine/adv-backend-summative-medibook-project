const Report = require("../models/reportModel");

exports.getDoctorStats = async (req, res, next) => {
  try {
    const stats = await Report.getDoctorStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
