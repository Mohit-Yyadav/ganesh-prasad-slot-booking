const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  getAllSlots,
  getSlotsForDate,
  createApplication,
  getApplicationStatus,
} = require("../controllers/publicController");

const router = express.Router();

const applyLimiter = rateLimit({
  windowMs: (Number(process.env.PUBLIC_APPLY_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.PUBLIC_APPLY_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many applications submitted. Please try again later." },
});

router.get("/slots", getAllSlots);
router.get("/slots/:date", getSlotsForDate);
router.post("/applications", applyLimiter, createApplication);
router.get("/applications/status", getApplicationStatus);

module.exports = router;
