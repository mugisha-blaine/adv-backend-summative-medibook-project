
require("dotenv").config();

const express = require("express");
const db = require("./src/config/db");
const patientRoutes = require("./src/routes/patientRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const errorHandler = require("./src/middleware/errorHandler");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const reportRoutes = require("./src/routes/reportRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/doctors", doctorRoutes);      
app.use("/reports", reportRoutes);
app.use("/patients", patientRoutes);
app.use("/appointments", appointmentRoutes);
app.use(errorHandler);

app.get("/", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({ message: "MediBook API is running", database: "connected" });
    } catch (error) {
        res.status(500).json({ message: "Database connection failed" });
    }
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
