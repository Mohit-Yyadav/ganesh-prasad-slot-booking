const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema(
  {
    // Stored as YYYY-MM-DD string for simple, unambiguous comparisons
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    session: {
      type: String,
      required: true,
      enum: ["morning", "evening"],
    },
    status: {
      type: String,
      enum: ["available", "closed", "allotted"],
      default: "available",
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    allottedAt: {
      type: Date,
      default: null,
    },
    allottedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    isOfficeAllotment: {
      type: Boolean,
      default: false,
    },
    officeNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// The core business rule: one date + one session must be a single document.
// This unique compound index is what makes double-allotment structurally impossible.
SlotSchema.index({ date: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Slot", SlotSchema);
