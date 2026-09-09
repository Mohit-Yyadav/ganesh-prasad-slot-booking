import React, { useState } from "react";
import { Building2, X, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import { adminAllotSlotToOffice } from "../services/api.js";
import { formatDateLong, sessionLabel } from "../utils/format.js";

export default function AllotOfficeModal({ open, slot, onClose, onSuccess }) {
  const [officeName, setOfficeName] = useState("Codes for Tomorrow (Office)");
  const [prasadItem, setPrasadItem] = useState("Office Arranged Prasad");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open || !slot) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await adminAllotSlotToOffice(slot._id, {
        officeName,
        prasadItem,
        note,
      });
      toast.success(data.message || "Slot successfully allotted to Office.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to allot slot to Office.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl text-maroon-900 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-maroon-900 font-bold text-lg">
            <Building2 className="text-amber-600" size={22} />
            <h2>Allot Slot to Office</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Slot Info */}
        <div className="mt-4 rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-maroon-900">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Target Slot</p>
          <p className="mt-1 text-sm font-bold text-maroon-950">
            📅 {formatDateLong(slot.date)}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="font-semibold text-maroon-800">Session:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              slot.session === "morning"
                ? "bg-amber-100 text-amber-950 border-amber-300"
                : "bg-purple-100 text-purple-950 border-purple-300"
            }`}>
              {slot.session === "morning" ? "☀️ Morning (By 9:00 AM)" : "🌙 Evening (By 6:00 PM)"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Office Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1.5">
              Office / Department Name
            </label>
            <input
              type="text"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-xl border border-gray-300 p-2.5 text-sm text-maroon-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Prasad Item */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1.5">
              Prasad Item
            </label>
            <div className="relative">
              <Gift className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
              <input
                type="text"
                value={prasadItem}
                onChange={(e) => setPrasadItem(e.target.value)}
                placeholder="e.g. Modak, Sweets, Fruits..."
                required
                className="min-h-[44px] w-full rounded-xl border border-gray-300 pl-10 pr-3 text-sm text-maroon-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1.5">
              Admin Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Arranged by HR / Self-funded by office"
              className="min-h-[44px] w-full rounded-xl border border-gray-300 p-2.5 text-sm text-maroon-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Building2 size={16} />}
              <span>Confirm Office Allotment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
