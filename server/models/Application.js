const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: /^[6-9]\d{9}$/, // valid Indian mobile number
    },
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
    prasadDeliveryMode: {
      type: String,
      default: "Self",
    },
    prasadItem: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

ApplicationSchema.index({ mobile: 1 });
ApplicationSchema.index({ date: 1, session: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ name: "text" });

module.exports = mongoose.model("Application", ApplicationSchema);
