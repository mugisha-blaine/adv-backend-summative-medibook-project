
const validateId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  next();
};

module.exports = validateId;
