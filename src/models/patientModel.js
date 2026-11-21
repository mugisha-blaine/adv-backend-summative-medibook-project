
const db = require("../config/db");

exports.create = async (name, email, phone) => {
    const [result] = await db.execute(
        "INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)",
        [name, email, phone]
    );
    return result.insertId;
};

exports.getAll = async () => {
    const [rows] = await db.execute("SELECT * FROM patients");
    return rows;
};

exports.getById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM patients WHERE id = ?",
        [id]
    );
    return rows[0];
};

exports.update = async (id, name, email, phone) => {
    const [result] = await db.execute(
        "UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?",
        [name, email, phone, id]
    );
    return result.affectedRows;
};

exports.remove = async (id) => {
    const [result] = await db.execute(
        "DELETE FROM patients WHERE id = ?",
        [id]
    );
    return result.affectedRows;
};
