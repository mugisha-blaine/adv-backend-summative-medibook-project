
const db = require("../config/db");

exports.create = async (name, specialty, fee, room) => {
    const [result] = await db.execute(
        "INSERT INTO doctors (name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)",
        [name, specialty, fee, room]
    );
    return result.insertId;
};

exports.getAll = async () => {
    const [rows] = await db.execute("SELECT * FROM doctors");
    return rows;
};

exports.getById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM doctors WHERE id = ?", [id]
    );
    return rows[0];
};

exports.update = async (id, name, specialty, fee, room) => {
    const [result] = await db.execute(
        "UPDATE doctors SET name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?",
        [name, specialty, fee, room, id]
    );
    return result.affectedRows;
};

exports.remove = async (id) => {
    const [result] = await db.execute(
        "DELETE FROM doctors WHERE id = ?", [id]
    );
    return result.affectedRows;
};
