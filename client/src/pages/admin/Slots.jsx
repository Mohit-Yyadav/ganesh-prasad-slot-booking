import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Lock,
  Ban,
  CircleDot,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Loader2,
} from "lucide-react";
import { adminListSlots, adminUpdateSlot, adminDeleteSlot } from "../../services/api.js";
import { LoadingState, ErrorState, EmptyState } from "../../components/States.jsx";
import CreateSlotModal from "../../components/CreateSlotModal.jsx";
import AllotOfficeModal from "../../components/AllotOfficeModal.jsx";
import { formatDateLong, sessionLabel } from "../../utils/format.js";

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [allotOfficeSlot, setAllotOfficeSlot] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminListSlots()
      .then((data) => setSlots(data.slots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(slot) {
    const nextStatus = slot.status === "available" ? "closed" : "available";
    if (slot.status === "allotted") {
      const isOffice = slot.isOfficeAllotment;
      const ok = window.confirm(
        isOffice
          ? "Release this Office allotment? The slot will become available again for booking."
          : "Are you sure you want to release this allotted slot? The devotee's application will be revoked and this slot will become available again."
      );
      if (!ok) return;
    }
    setUpdatingId(slot._id);
    try {
      await adminUpdateSlot(slot._id, nextStatus);
      toast.success(
        slot.status === "allotted"
          ? "Slot released and made available again."
          : `Slot marked as ${nextStatus}.`
      );
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(slot) {
    const ok = window.confirm(
      `Permanently delete the ${sessionLabel(slot.session)} slot on ${formatDateLong(slot.date)}?`
    );
    if (!ok) return;

    setDeletingId(slot._id);
    try {
      await adminDeleteSlot(slot._id);
      toast.success("Slot deleted successfully.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete slot.");
    } finally {
      setDeletingId(null);
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
    <div className="space-y-6 text-maroon-900">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-maroon-900">Slot Management</h1>
          <p className="text-sm font-medium text-maroon-700/80 mt-0.5">
            Create new slots, open/close bookings, allot directly to Office, or release slots.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-maroon-700 px-4 text-sm font-bold text-white shadow hover:opacity-95 active:scale-[0.99] transition"
        >
          <Plus size={18} /> Add New Slot
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No slots configured yet"
          description="Click 'Add New Slot' above to create date and session slots for the portal."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.date}
              className="flex flex-col gap-4 rounded-2xl border border-saffron-200 bg-white p-4 shadow-card lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-bold text-base text-maroon-950">📅 {formatDateLong(row.date)}</p>
                <p className="text-xs text-maroon-700/70 font-mono mt-0.5">{row.date}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 lg:max-w-2xl">
                {["morning", "evening"].map((session) => {
                  const slot = row[session];
                  if (!slot) {
                    return (
                      <div
                        key={session}
                        className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3 flex items-center justify-between text-xs text-gray-400"
                      >
                        <span className="font-semibold">{sessionLabel(session)}</span>
                        <span>Not Configured</span>
                      </div>
                    );
                  }
                  return (
                    <SlotPill
                      key={session}
                      slot={slot}
                      session={session}
                      updating={updatingId === slot._id}
                      deleting={deletingId === slot._id}
                      onToggle={() => toggleStatus(slot)}
                      onDelete={() => handleDelete(slot)}
                      onAllotOffice={() => setAllotOfficeSlot(slot)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSlotModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => load()}
      />

      <AllotOfficeModal
        open={!!allotOfficeSlot}
        slot={allotOfficeSlot}
        onClose={() => setAllotOfficeSlot(null)}
        onSuccess={() => load()}
      />
    </div>
  );
}

function SlotPill({
  slot,
  session,
  updating,
  deleting,
  onToggle,
  onDelete,
  onAllotOffice,
}) {
  const status = slot.status;
  const isOffice = slot.isOfficeAllotment;

  const styles = {
    available: "border-emerald-300 bg-emerald-50/80 text-emerald-950",
    closed: "border-gray-300 bg-gray-50 text-gray-800",
    allotted: isOffice
      ? "border-amber-300 bg-amber-50/80 text-amber-950"
      : "border-maroon-300 bg-maroon-50/80 text-maroon-950",
  };

  const Icon = status === "allotted" ? Lock : status === "closed" ? Ban : CircleDot;

  return (
    <div className={`rounded-xl border p-3.5 shadow-xs transition-all ${styles[status]}`}>
      {/* Pill Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          {session === "morning" ? "☀️" : "🌙"} {sessionLabel(session)}
        </span>
        <div className="flex items-center gap-1.5">
          {isOffice ? (
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
              🏢 Office
            </span>
          ) : (
            <Icon size={14} className="opacity-70" />
          )}
        </div>
      </div>

      {/* Status & Devotee / Office Info */}
      <div className="mt-2 min-h-[38px]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold capitalize">Status:</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              status === "available"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : status === "closed"
                ? "bg-gray-200 text-gray-800 border border-gray-300"
                : "bg-maroon-100 text-maroon-900 border border-maroon-300"
            }`}
          >
            {status}
          </span>
        </div>

        {status === "allotted" && (
          <div className="mt-1.5 text-xs">
            {isOffice ? (
              <div className="font-semibold text-amber-950">
                <span>🏢 Codes for Tomorrow (Office)</span>
                {slot.applicationId?.prasadItem && (
                  <p className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                    🍱 {slot.applicationId.prasadItem}
                  </p>
                )}
              </div>
            ) : slot.applicationId ? (
              <p className="truncate text-xs font-semibold text-maroon-900">
                <Link
                  to={`/admin/applications/${slot.applicationId._id}`}
                  className="underline hover:text-saffron-700"
                >
                  {slot.applicationId.applicationId} — {slot.applicationId.name}
                </Link>
              </p>
            ) : (
              <span className="italic text-gray-500">Allotted</span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-2.5">
        {status === "allotted" ? (
          <button
            onClick={onToggle}
            disabled={updating}
            className="flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-lg border border-red-300 bg-red-100 text-xs font-bold text-red-800 hover:bg-red-200 disabled:opacity-50 transition"
            title="Release allotment and make this slot available again"
          >
            {updating ? <Loader2 className="animate-spin" size={13} /> : null}
            <span>Release Slot</span>
          </button>
        ) : status === "available" ? (
          <>
            <button
              onClick={onAllotOffice}
              className="flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-lg bg-amber-600 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
              title="Directly allot this available slot to the Office"
            >
              <Building2 size={13} /> Allot to Office
            </button>
            <button
              onClick={onToggle}
              disabled={updating}
              className="min-h-[34px] rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition"
              title="Close this slot for applications"
            >
              {updating ? "..." : "Close"}
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              title="Delete Slot"
            >
              {deleting ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggle}
              disabled={updating}
              className="flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
              title="Open this slot for applications"
            >
              {updating ? <Loader2 className="animate-spin" size={13} /> : null}
              <span>Open Slot</span>
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              title="Delete Slot"
            >
              {deleting ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

