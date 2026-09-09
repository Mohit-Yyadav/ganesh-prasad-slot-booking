const Slot = require("../models/Slot");
const Application = require("../models/Application");
const { generateApplicationId } = require("../utils/generateId");
const { AppError } = require("../middleware/errorHandler");

const SESSIONS = ["morning", "evening"];

/**
 * GET /api/slots
 * Returns every configured slot, grouped by date, with availability info.
 * Public — no auth required. This is read-only; it is NEVER used to decide
 * whether a booking succeeds (the backend re-checks atomically on submit).
 */
async function getAllSlots(req, res, next) {
  try {
    const slots = await Slot.find({})
      .populate({ path: "applicationId", select: "name" })
      .sort({ date: 1, session: 1 })
      .lean();

    const byDate = {};
    for (const slot of slots) {
      if (!byDate[slot.date]) {
        byDate[slot.date] = { date: slot.date, morning: null, evening: null };
      }
      const applicantName = slot.isOfficeAllotment
        ? (slot.applicationId?.name || "Office (Arranged)")
        : (slot.applicationId?.name || null);
      byDate[slot.date][slot.session] = {
        status: slot.status, // available | closed | allotted
        name: applicantName,
        applicantName: applicantName,
      };
    }

    const dates = Object.values(byDate).sort((a, b) => (a.date > b.date ? 1 : -1));
    res.json({ dates });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/slots/:date  (date = YYYY-MM-DD)
 */
async function getSlotsForDate(req, res, next) {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("Please provide a valid date.", 400);
    }

    const slots = await Slot.find({ date })
      .populate({ path: "applicationId", select: "name" })
      .lean();
    if (slots.length === 0) {
      throw new AppError("This date is not available for booking.", 404);
    }

    const result = { date, morning: null, evening: null };
    for (const slot of slots) {
      const applicantName = slot.isOfficeAllotment
        ? (slot.applicationId?.name || "Office (Arranged)")
        : (slot.applicationId?.name || null);
      result[slot.session] = {
        status: slot.status,
        name: applicantName,
        applicantName: applicantName,
      };
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications
 * Body: { name, mobile, date, session }
 * Creates a PENDING application. Does not allot anything yet — allotment
 * only ever happens through the admin approval flow.
 */
async function createApplication(req, res, next) {
  try {
    const { name, mobile, date, session, prasadDeliveryMode, prasadItem } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      throw new AppError("Please enter your full name.", 400);
    }
    if (!mobile || !/^[6-9]\d{9}$/.test(String(mobile).trim())) {
      throw new AppError("Please enter a valid 10-digit mobile number.", 400);
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("Please select a valid date.", 400);
    }
    if (!session || !SESSIONS.includes(session)) {
      throw new AppError("Please select a valid session.", 400);
    }

    const slot = await Slot.findOne({ date, session });
    if (!slot) {
      throw new AppError("This date is no longer available.", 404);
    }
    if (slot.status === "closed") {
      throw new AppError("This slot is currently closed for applications.", 409);
    }
    if (slot.status === "allotted") {
      throw new AppError("This slot is already allotted. Please select another slot.", 409);
    }

    const applicationId = await generateApplicationId();

    const application = await Application.create({
      applicationId,
      name: name.trim(),
      mobile: String(mobile).trim(),
      date,
      session,
      prasadDeliveryMode: prasadDeliveryMode && String(prasadDeliveryMode).trim() ? String(prasadDeliveryMode).trim() : "Self",
      prasadItem: prasadItem && String(prasadItem).trim() ? String(prasadItem).trim() : "",
      status: "pending",
    });

    res.status(201).json({
      message: "Application submitted successfully.",
      application: {
        applicationId: application.applicationId,
        name: application.name,
        date: application.date,
        session: application.session,
        prasadDeliveryMode: application.prasadDeliveryMode,
        prasadItem: application.prasadItem,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/applications/status?applicationId=...  OR ?mobile=...
 */
async function getApplicationStatus(req, res, next) {
  try {
    const { applicationId, mobile } = req.query;

    if (!applicationId && !mobile) {
      throw new AppError("Please provide an Application ID or mobile number.", 400);
    }

    let query = {};
    if (applicationId) {
      const cleanId = String(applicationId).trim();
      const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.applicationId = { $regex: new RegExp(`^${escaped}$`, "i") };
    } else {
      if (!/^[6-9]\d{9}$/.test(String(mobile).trim())) {
        throw new AppError("Please enter a valid 10-digit mobile number.", 400);
      }
      query.mobile = String(mobile).trim();
    }

    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .limit(applicationId ? 1 : 20)
      .lean();

    if (applications.length === 0) {
      throw new AppError("No application found. Please check the details and try again.", 404);
    }

    const shaped = applications.map((a) => ({
      applicationId: a.applicationId,
      name: a.name,
      date: a.date,
      session: a.session,
      prasadDeliveryMode: a.prasadDeliveryMode || "Self",
      prasadItem: a.prasadItem || "",
      status: a.status,
      rejectionReason: a.rejectionReason,
      createdAt: a.createdAt,
      approvedAt: a.approvedAt,
      rejectedAt: a.rejectedAt,
    }));

    res.json(applicationId ? { application: shaped[0] } : { applications: shaped });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllSlots,
  getSlotsForDate,
  createApplication,
  getApplicationStatus,
};
