const jwt = require("jsonwebtoken");
const { Parser: CsvParser } = require("json2csv");
const Admin = require("../models/Admin");
const Application = require("../models/Application");
const Slot = require("../models/Slot");
const { generateApplicationId } = require("../utils/generateId");
const { AppError } = require("../middleware/errorHandler");

function signToken(admin) {
  return jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

/** POST /api/admin/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!password) {
      throw new AppError("Please enter your password.", 400);
    }

    let admin;
    if (email && String(email).trim()) {
      admin = await Admin.findOne({ email: String(email).toLowerCase().trim() }).select(
        "+passwordHash"
      );
    } else {
      // Allow single-field password login using the default or seeded admin account
      const defaultEmail = (process.env.SEED_ADMIN_EMAIL || "admin@admin.com").toLowerCase().trim();
      admin = await Admin.findOne({ email: defaultEmail }).select("+passwordHash");
      if (!admin) {
        admin = await Admin.findOne({ email: "admin@example.com" }).select("+passwordHash");
      }
      if (!admin) {
        admin = await Admin.findOne({}).select("+passwordHash");
      }
    }

    if (!admin || !(await admin.comparePassword(password))) {
      throw new AppError("Invalid password.", 401);
    }

    const token = signToken(admin);

    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/me */
async function me(req, res) {
  res.json({ admin: req.admin });
}

/** GET /api/admin/dashboard */
async function dashboard(req, res, next) {
  try {
    const [total, pending, approved, rejected, availableSlots] = await Promise.all([
      Application.countDocuments({}),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: "approved" }),
      Application.countDocuments({ status: "rejected" }),
      Slot.countDocuments({ status: "available" }),
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysApplications = await Application.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const recentApplications = await Application.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const upcomingSlots = await Slot.find({ status: "available" })
      .sort({ date: 1, session: 1 })
      .limit(10)
      .lean();

    const fullyBookedDatesAgg = await Slot.aggregate([
      { $group: { _id: "$date", statuses: { $push: "$status" } } },
      { $match: { statuses: { $not: { $elemMatch: { $ne: "allotted" } } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      stats: {
        totalApplications: total,
        pending,
        approved,
        rejected,
        availableSlots,
        todaysApplications,
      },
      recentApplications: recentApplications.map(shapeApplication),
      upcomingSlots,
      fullyBookedDates: fullyBookedDatesAgg.map((d) => d._id),
    });
  } catch (err) {
    next(err);
  }
}

function shapeApplication(a) {
  return {
    id: a._id,
    applicationId: a.applicationId,
    name: a.name,
    mobile: a.mobile,
    date: a.date,
    session: a.session,
    prasadDeliveryMode: a.prasadDeliveryMode || "Self",
    prasadItem: a.prasadItem || "",
    status: a.status,
    rejectionReason: a.rejectionReason,
    createdAt: a.createdAt,
    approvedAt: a.approvedAt,
    rejectedAt: a.rejectedAt,
  };
}

/** GET /api/admin/applications */
async function listApplications(req, res, next) {
  try {
    const {
      search,
      status,
      date,
      session,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    if (date) query.date = date;
    if (session && ["morning", "evening"].includes(session)) query.session = session;

    if (search) {
      const s = String(search).trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { mobile: { $regex: s, $options: "i" } },
        { applicationId: { $regex: s, $options: "i" } },
      ];
    }

    let sortSpec = { createdAt: -1 };
    if (sort === "oldest") sortSpec = { createdAt: 1 };
    if (sort === "date") sortSpec = { date: 1, session: 1 };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, totalCount] = await Promise.all([
      Application.find(query)
        .sort(sortSpec)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Application.countDocuments(query),
    ]);

    res.json({
      applications: items.map(shapeApplication),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/applications/:id */
async function getApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).lean();
    if (!application) throw new AppError("Application not found.", 404);
    res.json({ application: shapeApplication(application) });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/applications/:id/approve
 *
 * This is the single most important operation in the system. It uses an
 * atomic, condition-guarded update on the Slot document so that even if two
 * admins click "Approve" at almost the same instant, only one can possibly
 * win the slot. The second request is rejected with a clear message instead
 * of silently overwriting the first.
 */
async function approveApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) throw new AppError("Application not found.", 404);

    if (application.status === "approved") {
      throw new AppError("This application has already been approved.", 409);
    }
    if (application.status === "rejected") {
      throw new AppError("This application was already rejected and cannot be approved.", 409);
    }

    // Atomic, condition-guarded claim: only succeeds if the slot is still
    // "available". This is what actually prevents double allotment.
    const claimedSlot = await Slot.findOneAndUpdate(
      { date: application.date, session: application.session, status: "available" },
      {
        $set: {
          status: "allotted",
          applicationId: application._id,
          allottedAt: new Date(),
          allottedBy: req.admin.id,
        },
      },
      { new: true }
    );

    if (!claimedSlot) {
      throw new AppError(
        "This slot has already been allotted to another applicant. Please refresh and try a different application.",
        409
      );
    }

    application.status = "approved";
    application.approvedAt = new Date();
    application.approvedBy = req.admin.id;
    await application.save();

    res.json({
      message: "Application approved and slot allotted successfully.",
      application: shapeApplication(application.toObject()),
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/applications/:id/reject */
async function rejectApplication(req, res, next) {
  try {
    const { reason } = req.body || {};
    const application = await Application.findById(req.params.id);
    if (!application) throw new AppError("Application not found.", 404);

    const wasApproved = application.status === "approved";

    // If application was already approved, release its slot back to available
    if (wasApproved) {
      await Slot.findOneAndUpdate(
        { date: application.date, session: application.session, applicationId: application._id },
        {
          $set: {
            status: "available",
            applicationId: null,
            allottedAt: null,
            allottedBy: null,
          },
        }
      );
    }

    application.status = "rejected";
    application.rejectedAt = new Date();
    application.rejectionReason =
      reason && String(reason).trim()
        ? String(reason).trim()
        : wasApproved
        ? "Slot allotment revoked by admin."
        : null;
    await application.save();

    res.json({
      message: wasApproved
        ? "Allotment revoked and slot made available again."
        : "Application rejected.",
      application: shapeApplication(application.toObject()),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/slots */
async function listSlots(req, res, next) {
  try {
    const slots = await Slot.find({})
      .populate({ path: "applicationId", select: "applicationId name mobile status" })
      .sort({ date: 1, session: 1 })
      .lean();
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/slots/:id
 * Body: { status: 'available' | 'closed' }
 * Admin can toggle between available/closed.
 * If slot was allotted, releasing it will also cancel/revoke the associated application.
 */
async function updateSlot(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!["available", "closed"].includes(status)) {
      throw new AppError("Invalid slot status.", 400);
    }

    const slot = await Slot.findById(req.params.id);
    if (!slot) throw new AppError("Slot not found.", 404);

    if (slot.status === "allotted") {
      // Release slot: mark linked application as revoked/rejected
      if (slot.applicationId) {
        await Application.findByIdAndUpdate(slot.applicationId, {
          $set: {
            status: "rejected",
            rejectedAt: new Date(),
            rejectionReason: "Slot allotment revoked via Slot Management.",
          },
        });
      }
      slot.applicationId = null;
      slot.allottedAt = null;
      slot.allottedBy = null;
      slot.isOfficeAllotment = false;
      slot.officeNote = "";
    }

    slot.status = status;
    await slot.save();

    res.json({ message: "Slot updated successfully.", slot });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/slots
 * Body: { date, session, sessions, status }
 * Creates new slot(s) for a given date.
 */
async function createSlot(req, res, next) {
  try {
    const { date, session, sessions, status = "available" } = req.body || {};
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("Please provide a valid date (YYYY-MM-DD).", 400);
    }

    const sessionsToCreate =
      sessions && Array.isArray(sessions) && sessions.length > 0
        ? sessions
        : session
        ? [session]
        : ["morning", "evening"];

    for (const s of sessionsToCreate) {
      if (!["morning", "evening"].includes(s)) {
        throw new AppError(`Invalid session: ${s}. Must be 'morning' or 'evening'.`, 400);
      }
    }

    const createdSlots = [];
    const skippedSessions = [];

    for (const s of sessionsToCreate) {
      const existing = await Slot.findOne({ date, session: s });
      if (existing) {
        skippedSessions.push(s);
        continue;
      }
      const newSlot = await Slot.create({
        date,
        session: s,
        status: status === "closed" ? "closed" : "available",
      });
      createdSlots.push(newSlot);
    }

    if (createdSlots.length === 0 && skippedSessions.length > 0) {
      throw new AppError(`Slot(s) for ${date} already exist (${skippedSessions.join(", ")}).`, 409);
    }

    res.status(201).json({
      message: `Successfully created ${createdSlots.length} slot(s) for ${date}.`,
      slots: createdSlots,
      skipped: skippedSessions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/slots/:id
 * Removes a slot from the schedule.
 */
async function deleteSlot(req, res, next) {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) throw new AppError("Slot not found.", 404);

    if (slot.status === "allotted") {
      if (slot.applicationId) {
        await Application.findByIdAndUpdate(slot.applicationId, {
          $set: {
            status: "rejected",
            rejectedAt: new Date(),
            rejectionReason: "Slot was deleted by administrator.",
          },
        });
      }
    }

    await Slot.findByIdAndDelete(req.params.id);
    res.json({ message: "Slot deleted successfully.", id: req.params.id });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/slots/:id/allot-office
 * Body: { officeName, prasadItem, note }
 * Directly allots a slot to the Office.
 */
async function allotSlotToOffice(req, res, next) {
  try {
    const {
      officeName = "Codes for Tomorrow (Office)",
      prasadItem = "Office Arranged Prasad",
      note = "",
    } = req.body || {};

    const slot = await Slot.findById(req.params.id);
    if (!slot) throw new AppError("Slot not found.", 404);

    if (slot.status === "allotted" && !slot.isOfficeAllotment) {
      throw new AppError(
        "This slot is already allotted to an applicant. Release it before allotting to Office.",
        409
      );
    }

    const applicationId = await generateApplicationId();

    const officeApp = await Application.create({
      applicationId,
      name: String(officeName).trim() || "Codes for Tomorrow (Office)",
      mobile: "9999999999",
      date: slot.date,
      session: slot.session,
      prasadDeliveryMode: "Office",
      prasadItem: String(prasadItem).trim() || "Office Arranged Prasad",
      status: "approved",
      approvedAt: new Date(),
      approvedBy: req.admin?.id || null,
    });

    slot.status = "allotted";
    slot.applicationId = officeApp._id;
    slot.isOfficeAllotment = true;
    slot.officeNote = String(note).trim();
    slot.allottedAt = new Date();
    slot.allottedBy = req.admin?.id || null;
    await slot.save();

    await slot.populate({
      path: "applicationId",
      select: "applicationId name mobile status prasadItem prasadDeliveryMode",
    });

    res.json({
      message: `Slot on ${slot.date} (${slot.session}) successfully allotted to Office.`,
      slot,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/applications/export?format=csv */
async function exportApplications(req, res, next) {
  try {
    const applications = await Application.find({}).sort({ createdAt: -1 }).lean();

    const rows = applications.map((a) => ({
      "Application ID": a.applicationId,
      Name: a.name,
      Mobile: a.mobile,
      Date: a.date,
      Session: a.session,
      "Delivery Mode": a.prasadDeliveryMode || "Self",
      "Prasad Item": a.prasadItem || "",
      Status: a.status,
      "Applied At": a.createdAt ? new Date(a.createdAt).toISOString() : "",
      "Approved At": a.approvedAt ? new Date(a.approvedAt).toISOString() : "",
    }));

    const parser = new CsvParser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`applications-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/applications/:id/slot
 * Body: { date, session }
 * Allows admin to reschedule an application to any available slot.
 */
async function updateApplicationSlot(req, res, next) {
  try {
    const { date, session } = req.body || {};
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("Please provide a valid date (YYYY-MM-DD).", 400);
    }
    if (!session || !["morning", "evening"].includes(session)) {
      throw new AppError("Please select a valid session (morning or evening).", 400);
    }

    const application = await Application.findById(req.params.id);
    if (!application) throw new AppError("Application not found.", 404);

    // If already on the requested slot, no change needed
    if (application.date === date && application.session === session) {
      return res.json({
        message: "Application is already scheduled for this slot.",
        application: shapeApplication(application.toObject()),
      });
    }

    // Check target slot status
    const targetSlot = await Slot.findOne({ date, session });
    if (!targetSlot) {
      throw new AppError("Selected slot does not exist.", 404);
    }
    if (targetSlot.status === "closed") {
      throw new AppError("This slot is currently closed for bookings.", 409);
    }
    if (targetSlot.status === "allotted") {
      throw new AppError("This slot is already allotted to another applicant.", 409);
    }

    // If the application was already approved, transfer allotment
    if (application.status === "approved") {
      // 1. Atomically claim new slot
      const claimedNewSlot = await Slot.findOneAndUpdate(
        { date, session, status: "available" },
        {
          $set: {
            status: "allotted",
            applicationId: application._id,
            allottedAt: new Date(),
            allottedBy: req.admin.id,
          },
        },
        { new: true }
      );

      if (!claimedNewSlot) {
        throw new AppError("Target slot was just taken. Please select another slot.", 409);
      }

      // 2. Free up the old slot
      await Slot.findOneAndUpdate(
        { date: application.date, session: application.session, applicationId: application._id },
        {
          $set: {
            status: "available",
            applicationId: null,
            allottedAt: null,
            allottedBy: null,
          },
        }
      );
    } else if (application.status === "rejected") {
      // If was previously rejected, re-open it as pending on the new slot
      application.status = "pending";
      application.rejectionReason = null;
      application.rejectedAt = null;
    }

    // Update application slot
    application.date = date;
    application.session = session;
    await application.save();

    res.json({
      message: `Application rescheduled to ${date} (${session}) successfully.`,
      application: shapeApplication(application.toObject()),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/applications/:id
 * Body: { prasadItem, prasadDeliveryMode, name, mobile }
 * Allows admin to edit application details (such as Prasad Item or Delivery Mode).
 */
async function updateApplicationDetails(req, res, next) {
  try {
    const { prasadItem, prasadDeliveryMode, name, mobile } = req.body || {};
    const application = await Application.findById(req.params.id);
    if (!application) throw new AppError("Application not found.", 404);

    if (prasadItem !== undefined) application.prasadItem = String(prasadItem).trim();
    if (prasadDeliveryMode !== undefined) application.prasadDeliveryMode = String(prasadDeliveryMode).trim();
    if (name) application.name = String(name).trim();
    if (mobile) application.mobile = String(mobile).trim();

    await application.save();
    res.json({
      message: "Application updated successfully.",
      application: shapeApplication(application.toObject()),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
