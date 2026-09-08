const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

/**
 * Protects admin routes. Expects a Bearer token in the Authorization header.
 */
async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    req.admin = { id: admin._id.toString(), email: admin.email, name: admin.name };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

module.exports = { requireAdmin };
