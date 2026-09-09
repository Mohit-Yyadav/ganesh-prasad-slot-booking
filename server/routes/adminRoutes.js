const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAdmin } = require("../middleware/auth");
const {
  login,
  me,
  dashboard,
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  updateApplicationSlot,
  updateApplicationDetails,
  listSlots,
  updateSlot,
  createSlot,
  deleteSlot,
  allotSlotToOffice,
  exportApplications,
} = require("../controllers/adminController");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, login);

// Everything below requires a valid admin session
router.use(requireAdmin);

router.get("/me", me);
router.get("/dashboard", dashboard);

router.get("/applications", listApplications);
router.get("/applications/export", exportApplications);
router.get("/applications/:id", getApplication);
router.patch("/applications/:id", updateApplicationDetails);
router.patch("/applications/:id/approve", approveApplication);
router.patch("/applications/:id/reject", rejectApplication);
router.patch("/applications/:id/slot", updateApplicationSlot);

router.get("/slots", listSlots);
router.post("/slots", createSlot);
router.patch("/slots/:id", updateSlot);
router.delete("/slots/:id", deleteSlot);
router.patch("/slots/:id/allot-office", allotSlotToOffice);

module.exports = router;
