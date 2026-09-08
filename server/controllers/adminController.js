const jwt = require("jsonwebtoken");
const { Parser: CsvParser } = require("json2csv");
const Admin = require("../models/Admin");
const Application = require("../models/Application");
const Slot = require("../models/Slot");
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
    if (email) {
      admin = await Admin.findOne({ email: String(email).toLowerCase().trim() }).select(
        "+passwordHash"
      );
    } else {
      // Allow single-field password login using the default admin account
      const defaultEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
      admin = await Admin.findOne({ email: defaultEmail }).select("+passwordHash");
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

    // Courtesy cleanup: any other still-pending applications for the exact
    // same date + session can no longer be granted, so we close them out
    // with a clear reason rather than leaving them stuck as "pending".
    await Application.updateMany(
      {
        _id: { $ne: application._id },
        date: application.date,
        session: application.session,
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: "This slot was allotted to another applicant.",
        },
      }
    );

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

    if (application.status === "approved") {
      throw new AppError(
        "This application is already approved. Reverting an approved allotment must be done from Slot Management.",
        409
      );
    }

    application.status = "rejected";
    application.rejectedAt = new Date();
    application.rejectionReason = reason && String(reason).trim() ? String(reason).trim() : null;
    await application.save();

    res.json({
      message: "Application rejected.",
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
 * Admin can only toggle between available/closed manually.
 * A slot can never be pushed back from "allotted" here — that would
 * silently break the one-slot-one-applicant guarantee.
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
      throw new AppError(
        "This slot is already allotted and cannot be modified from here.",
        409
      );
    }

    slot.status = status;
    await slot.save();

    res.json({ message: "Slot updated successfully.", slot });
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

module.exports = {
  login,
  me,
  dashboard,
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  listSlots,
  updateSlot,
  exportApplications,
};
