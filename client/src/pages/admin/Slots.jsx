import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Ban, CircleDot } from "lucide-react";
import { adminListSlots, adminUpdateSlot } from "../../services/api.js";
import { LoadingState, ErrorState } from "../../components/States.jsx";
import { formatDateLong, sessionLabel } from "../../utils/format.js";

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminListSlots()
      .then((data) => setSlots(data.slots))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(slot) {
    const nextStatus = slot.status === "available" ? "closed" : "available";
    setUpdatingId(slot._id);
    try {
      await adminUpdateSlot(slot._id, nextStatus);
      toast.success(`Slot marked as ${nextStatus}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <LoadingState label="Loading slots..." />;
  if (error) return <ErrorState message={error} />;

  // Group by date
  const byDate = {};
  for (const s of slots) {
    if (!byDate[s.date]) byDate[s.date] = { date: s.date };
    byDate[s.date][s.session] = s;
  }
  const rows = Object.values(byDate).sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-maroon-800">Slot Management</h1>
        <p className="text-sm text-maroon-700/70">
          Open or close slots for new applications. Allotted slots are locked and cannot be
          changed here.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.date}
            className="flex flex-col gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-semibold text-maroon-800">{formatDateLong(row.date)}</p>
            <div className="flex gap-3">
              {["morning", "evening"].map((session) => {
                const slot = row[session];
                if (!slot) return null;
                return (
                  <SlotPill
                    key={session}
                    slot={slot}
                    session={session}
                    updating={updatingId === slot._id}
                    onToggle={() => toggleStatus(slot)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotPill({ slot, session, updating, onToggle }) {
  const status = slot.status;

  const styles = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-700",
    closed: "border-gray-200 bg-gray-50 text-gray-600",
    allotted: "border-maroon-200 bg-maroon-50 text-maroon-700",
  };

  const Icon = status === "allotted" ? Lock : status === "closed" ? Ban : CircleDot;

  return (
    <div className={`min-w-[150px] rounded-xl border p-3 ${styles[status]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {sessionLabel(session)}
        </span>
        <Icon size={14} />
      </div>
      <p className="mt-1 text-sm font-medium capitalize">{status}</p>

      {status === "allotted" && slot.applicationId && (
        <p className="mt-1 truncate text-xs opacity-80">
          <Link to={`/admin/applications/${slot.applicationId._id}`} className="underline">
            {slot.applicationId.applicationId} — {slot.applicationId.name}
          </Link>
        </p>
      )}

      {status !== "allotted" && (
        <button
          onClick={onToggle}
          disabled={updating}
          className="mt-2 min-h-[36px] w-full rounded-lg border border-current text-xs font-semibold hover:opacity-80 disabled:opacity-50"
        >
          {updating ? "Updating..." : status === "available" ? "Close Slot" : "Open Slot"}
        </button>
      )}
    </div>
  );
}
