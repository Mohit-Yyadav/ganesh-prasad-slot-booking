import React, { useEffect, useState } from "react";
import { Calendar, Clock, Loader2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { adminListSlots, adminUpdateApplicationSlot } from "../services/api.js";
import { formatDateLong, sessionLabel } from "../utils/format.js";

export default function RescheduleModal({ open, application, onClose, onSuccess }) {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingSlots(true);
    adminListSlots()
      .then((data) => {
        setSlots(data.slots || []);
        // Find available dates
        const available = (data.slots || []).filter((s) => s.status === "available");
        if (available.length > 0) {
          // Preselect first available date different from current if possible
          const diffSlot = available.find(
            (s) => s.date !== application?.date || s.session !== application?.session
          ) || available[0];
          setSelectedDate(diffSlot.date);
          setSelectedSession(diffSlot.session);
        }
      })
      .catch((err) => toast.error("Failed to load slots: " + err.message))
      .finally(() => setLoadingSlots(false));
  }, [open, application]);

  if (!open || !application) return null;

  // Group slots by date
  const byDate = {};
  for (const s of slots) {
    if (!byDate[s.date]) byDate[s.date] = {};
    byDate[s.date][s.session] = s.status; // available | closed | allotted
  }

  const availableDates = Object.keys(byDate).filter(
    (d) => byDate[d].morning === "available" || byDate[d].evening === "available"
  ).sort();

  const morningAvailable = byDate[selectedDate]?.morning === "available";
  const eveningAvailable = byDate[selectedDate]?.evening === "available";

  async function handleSave() {
    if (!selectedDate || !selectedSession) {
      toast.error("Please select both a date and session.");
      return;
    }
    if (selectedDate === application.date && selectedSession === application.session) {
      toast.info("Application is already on this slot.");
      onClose();
      return;
    }

    setSaving(true);
    try {
      const data = await adminUpdateApplicationSlot(application.id, {
        date: selectedDate,
        session: selectedSession,
      });
      toast.success(data.message || "Slot updated successfully.");
      onSuccess(data.application);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update slot.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-maroon-800">
            <Calendar className="text-saffron-600" size={20} />
            <h2 className="text-lg font-bold">Change / Reschedule Slot</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Applicant info */}
        <div className="mt-4 rounded-xl bg-saffron-50/60 border border-saffron-200/60 p-3.5 text-xs text-maroon-900">
          <div className="font-semibold text-sm">{application.name}</div>
          <div className="text-maroon-700/80 mt-0.5">ID: {application.applicationId}</div>
          <div className="mt-2 flex items-center gap-1.5 text-maroon-800 font-medium">
            <span>Current Slot:</span>
            <span className="bg-white/80 px-2 py-0.5 rounded border border-saffron-200">
              {formatDateLong(application.date)} ({sessionLabel(application.session)})
            </span>
          </div>
        </div>

        {application.status === "approved" && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <span>
              This application is <strong>Approved</strong>. Rescheduling will automatically free up the old slot and allot the new slot.
            </span>
          </div>
        )}

        {loadingSlots ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500 text-sm">
            <Loader2 className="animate-spin text-saffron-600" size={24} />
            <span>Checking available slots...</span>
          </div>
        ) : availableDates.length === 0 ? (
          <div className="py-6 text-center text-sm text-red-600 font-medium">
            No other slots are currently available. All slots are fully booked or closed.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Date selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Select New Available Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => {
                  const newD = e.target.value;
                  setSelectedDate(newD);
                  // Automatically choose the available session for this date
                  if (byDate[newD]?.morning === "available") {
                    setSelectedSession("morning");
                  } else if (byDate[newD]?.evening === "available") {
                    setSelectedSession("evening");
                  }
                }}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm text-gray-800 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500 outline-none"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {formatDateLong(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Session selector buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Select Session
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!morningAvailable}
                  onClick={() => setSelectedSession("morning")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSession === "morning"
                      ? "border-saffron-500 bg-saffron-50 text-maroon-900 font-bold shadow-sm"
                      : morningAvailable
                      ? "border-gray-200 hover:bg-gray-50 text-gray-800"
                      : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div className="text-sm font-semibold flex items-center justify-between">
                    <span>Morning</span>
                    <Clock size={14} />
                  </div>
                  <div className="text-[11px] mt-0.5 font-normal">
                    {morningAvailable ? "Available" : "Not Available"}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!eveningAvailable}
                  onClick={() => setSelectedSession("evening")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSession === "evening"
                      ? "border-saffron-500 bg-saffron-50 text-maroon-900 font-bold shadow-sm"
                      : eveningAvailable
                      ? "border-gray-200 hover:bg-gray-50 text-gray-800"
                      : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div className="text-sm font-semibold flex items-center justify-between">
                    <span>Evening</span>
                    <Clock size={14} />
                  </div>
                  <div className="text-[11px] mt-0.5 font-normal">
                    {eveningAvailable ? "Available" : "Not Available"}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              saving ||
              loadingSlots ||
              availableDates.length === 0 ||
              !selectedDate ||
              !selectedSession ||
              (selectedDate === application.date && selectedSession === application.session)
            }
            className="flex-1 rounded-xl bg-gradient-to-r from-saffron-600 to-maroon-700 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>Update Slot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
