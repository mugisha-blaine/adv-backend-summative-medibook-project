
const errorHandler = (err, req, res, next) => {
    console.error(err.message);

    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Record already exists" });
    }

    if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            message: "Cannot delete a record linked to appointments"
        });
    }

    if (err.status) {
        return res.status(err.status).json({
            message: err.message
        });
    }

    res.status(500).json({ message: "Internal server error" });
};

module.exports = errorHandler;
