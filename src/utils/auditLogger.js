const fs = require("fs/promises");
const path = require("path");

const logFile = path.join(__dirname, "../../logs/audit.log");

const auditLogger = async (action, details, strict = false) => {
    try {
        await fs.mkdir(path.dirname(logFile), { recursive: true });

        const entry = {
            timestamp: new Date().toISOString(),
            action,
            ...details
        };

        await fs.appendFile(logFile, JSON.stringify(entry) + "\n");
    } catch (error) {
        console.error("Audit logging failed:", error.message);
        if (strict) throw error;
    }
};

module.exports = auditLogger;
