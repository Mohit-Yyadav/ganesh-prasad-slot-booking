import React, { useState } from "react";
import { Plus, X, Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { adminCreateSlot } from "../services/api.js";
import { formatDateLong } from "../utils/format.js";

export default function CreateSlotModal({ open, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [sessionOption, setSessionOption] = useState("both"); // "morning" | "evening" | "both"
  const [status, setStatus] = useState("available"); // "available" | "closed"
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    const sessions =
      sessionOption === "both" ? ["morning", "evening"] : [sessionOption];

    setSubmitting(true);
    try {
      const data = await adminCreateSlot({
        date,
        sessions,
        status,
      });
      toast.success(data.message || `Slot(s) created successfully for ${formatDateLong(date)}.`);
      if (data.skipped && data.skipped.length > 0) {
        toast.info(`Note: ${data.skipped.join(", ")} session(s) already existed.`);
      }
      onSuccess();
      onClose();
      setDate("");
    } catch (err) {
      toast.error(err.message || "Failed to create slot.");
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
            <Calendar className="text-saffron-600" size={20} />
            <h2>Create New Slot</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1.5">
              Select Slot Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-xl border border-gray-300 p-2.5 text-sm text-maroon-900 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500 outline-none"
            />
            {date && (
              <p className="mt-1 text-xs font-medium text-saffron-700">
                📅 {formatDateLong(date)}
              </p>
            )}
          </div>

          {/* Sessions Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1.5">
              Sessions to Create
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSessionOption("both")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  sessionOption === "both"
                    ? "border-saffron-600 bg-saffron-50 text-saffron-900 shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Both Sessions
                <div className="text-[10px] font-normal text-gray-500 mt-0.5">Morning & Evening</div>
              </button>

              <button
                type="button"
                onClick={() => setSessionOption("morning")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  sessionOption === "morning"
                    ? "border-amber-600 bg-amber-50 text-amber-900 shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                ☀️ Morning
                <div className="text-[10px] font-normal text-gray-500 mt-0.5">By 9:00 AM</div>
              </button>

              <button
                type="button"
                onClick={() => setSessionOption("evening")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  sessionOption === "evening"
                    ? "border-purple-600 bg-purple-50 text-purple-900 shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                🌙 Evening
                <div className="text-[10px] font-normal text-gray-500 mt-0.5">By 6:00 PM</div>
              </button>
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1.5">
              Initial Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("available")}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  status === "available"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                🟢 Available (Open)
              </button>
              <button
                type="button"
                onClick={() => setStatus("closed")}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  status === "closed"
                    ? "border-gray-600 bg-gray-100 text-gray-900 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                🔒 Closed (Locked)
              </button>
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={submitting || !date}
              className="flex-1 rounded-xl bg-gradient-to-r from-saffron-600 to-maroon-700 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              <span>Create Slot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
