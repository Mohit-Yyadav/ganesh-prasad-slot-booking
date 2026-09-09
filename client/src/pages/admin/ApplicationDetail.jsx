import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, Check, X, Calendar, Pencil } from "lucide-react";
import {
  adminGetApplication,
  adminApprove,
  adminReject,
  adminUpdateApplication,
} from "../../services/api.js";
import { LoadingState, ErrorState } from "../../components/States.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import RescheduleModal from "../../components/RescheduleModal.jsx";
import { formatDateLong, sessionLabel } from "../../utils/format.js";

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const [editingPrasad, setEditingPrasad] = useState(false);
  const [prasadItemInput, setPrasadItemInput] = useState("");
  const [prasadModeInput, setPrasadModeInput] = useState("Self");
  const [savingPrasad, setSavingPrasad] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetApplication(id)
      .then((data) => {
        setApplication(data.application);
        setPrasadItemInput(data.application?.prasadItem || "");
        setPrasadModeInput(data.application?.prasadDeliveryMode || "Self");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  async function handleSavePrasad() {
    setSavingPrasad(true);
    try {
      const data = await adminUpdateApplication(id, {
        prasadItem: prasadItemInput,
        prasadDeliveryMode: prasadModeInput,
      });
      setApplication(data.application);
      setEditingPrasad(false);
      toast.success("Prasad details updated successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to update Prasad details.");
    } finally {
      setSavingPrasad(false);
    }
  }

  async function handleConfirm() {
    setActionLoading(true);
    try {
      if (confirmAction === "approve") {
        const { application } = await adminApprove(id);
        setApplication(application);
        toast.success("Application approved and slot allotted.");
      } else {
        const { application } = await adminReject(id);
        setApplication(application);
        toast.success(
          confirmAction === "revoke"
            ? "Allotment revoked and slot made available again."
            : "Application rejected."
        );
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.message);
      load();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <LoadingState label="Loading application..." />;
  if (error) return <ErrorState message={error} />;
  if (!application) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/admin/applications"
        className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-maroon-700 hover:text-saffron-600"
      >
        <ChevronLeft size={16} /> Back to Applications
      </Link>

      <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-saffron-100 bg-saffron-50 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-saffron-700">Application Details</p>
            <p className="font-semibold text-maroon-800">{application.applicationId}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="divide-y divide-saffron-100">
          <Row label="Applicant Name" value={application.name} />
          <Row label="Mobile" value={application.mobile} />
          <Row
            label="Requested Date"
            value={
              <div className="flex items-center justify-end gap-2">
                <span>{formatDateLong(application.date)}</span>
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(true)}
                  className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition inline-flex items-center gap-1"
                >
                  <Calendar size={12} /> Change
                </button>
              </div>
            }
          />
          <Row
            label="Requested Session"
            value={
              <div className="flex items-center justify-end gap-2">
                <span>{sessionLabel(application.session)}</span>
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(true)}
                  className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition inline-flex items-center gap-1"
                >
                  <Calendar size={12} /> Change
                </button>
              </div>
            }
          />
          <Row
            label="Prasad Item"
            value={
              editingPrasad ? (
                <div className="flex items-center gap-2 justify-end w-full max-w-xs">
                  <input
                    value={prasadItemInput}
                    onChange={(e) => setPrasadItemInput(e.target.value)}
                    placeholder="e.g. Modak, Ladoo..."
                    className="rounded-lg border border-amber-400 px-2.5 py-1 text-xs text-maroon-900 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSavePrasad}
                    disabled={savingPrasad}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrasadItemInput(application.prasadItem || "");
                      setEditingPrasad(false);
                    }}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <span className={application.prasadItem ? "font-semibold text-amber-900" : "text-gray-400 italic"}>
                    {application.prasadItem || "Not specified (click Edit)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrasadItemInput(application.prasadItem || "");
                      setPrasadModeInput(application.prasadDeliveryMode || "Self");
                      setEditingPrasad(true);
                    }}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition inline-flex items-center gap-1"
                    title="Edit Prasad Item"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              )
            }
          />
          <Row
            label="Delivery Mode"
            value={
              editingPrasad ? (
                <div className="flex items-center gap-2 justify-end">
                  <select
                    value={prasadModeInput}
                    onChange={(e) => setPrasadModeInput(e.target.value)}
                    className="rounded-lg border border-amber-400 px-2 py-1 text-xs text-maroon-900 focus:outline-none"
                  >
                    <option value="Self">Self (I will bring it)</option>
                    <option value="Office">Office (Deliver/arrange at office)</option>
                  </select>
                </div>
              ) : (
                <span>{application.prasadDeliveryMode || "Self"}</span>
              )
            }
          />
          <Row
            label="Office Arrival Deadline"
            value={application.session === "morning" ? "By 9:00 AM" : "By 6:00 PM"}
          />
          <Row
            label="Applied At"
            value={application.createdAt ? new Date(application.createdAt).toLocaleString("en-IN") : "—"}
          />
          {application.rejectionReason && (
            <Row label="Rejection Reason" value={application.rejectionReason} />
          )}
        </div>

        {application.status === "pending" && (
          <div className="flex flex-col sm:flex-row gap-3 p-5">
            <button
              onClick={() => setConfirmAction("approve")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] transition"
            >
              <Check size={18} /> Approve & Allot
            </button>
            <button
              onClick={() => setRescheduleOpen(true)}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 active:scale-[0.99] transition"
            >
              <Calendar size={18} className="text-white" /> Change Slot
            </button>
            <button
              onClick={() => setConfirmAction("reject")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-[0.99] transition"
            >
              <X size={18} /> Reject
            </button>
          </div>
        )}

        {application.status === "approved" && (
          <div className="flex flex-col sm:flex-row gap-3 p-5">
            <button
              onClick={() => setRescheduleOpen(true)}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 active:scale-[0.99] transition"
            >
              <Calendar size={18} className="text-white" /> Reschedule Slot
            </button>
            <button
              onClick={() => setConfirmAction("revoke")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-[0.99] transition"
            >
              <X size={18} /> Revoke Allotment
            </button>
          </div>
        )}

        {application.status === "rejected" && (
          <div className="p-5">
            <button
              onClick={() => setRescheduleOpen(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 active:scale-[0.99] transition"
            >
              <Calendar size={18} className="text-white" /> Assign to Another Slot (Reopen)
            </button>
          </div>
        )}
      </div>

      <RescheduleModal
        open={rescheduleOpen}
        application={application}
        onClose={() => setRescheduleOpen(false)}
        onSuccess={(updated) => setApplication(updated)}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={
          confirmAction === "approve"
            ? "Approve & Allot Slot?"
            : confirmAction === "revoke"
            ? "Revoke Allotment & Release Slot?"
            : "Reject Application?"
        }
        description={
          confirmAction === "approve" ? (
            <>
              You are about to allot{" "}
              <strong>
                {formatDateLong(application.date)} · {sessionLabel(application.session)}
              </strong>
              . This slot will become unavailable for all other applicants.
            </>
          ) : confirmAction === "revoke" ? (
            <>
              Are you sure you want to revoke this allotment? The slot will become <strong>Available</strong> again for new bookings, and this application will be marked as rejected.
            </>
          ) : (
            <>This application will be marked as rejected.</>
          )
        }
        confirmLabel={
          confirmAction === "approve"
            ? "Confirm & Allot"
            : confirmAction === "revoke"
            ? "Revoke Allotment"
            : "Reject"
        }
        tone={confirmAction === "approve" ? "primary" : "danger"}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-maroon-700/70">{label}</span>
      <span className="text-right text-sm font-medium text-maroon-800">{value}</span>
    </div>
  );
}
