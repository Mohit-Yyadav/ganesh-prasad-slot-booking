import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, Check, X } from "lucide-react";
import { adminGetApplication, adminApprove, adminReject } from "../../services/api.js";
import { LoadingState, ErrorState } from "../../components/States.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import { formatDateLong, sessionLabel } from "../../utils/format.js";

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetApplication(id)
      .then((data) => setApplication(data.application))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

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
        toast.success("Application rejected.");
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
          <Row label="Requested Date" value={formatDateLong(application.date)} />
          <Row label="Requested Session" value={sessionLabel(application.session)} />
          <Row
            label="Applied At"
            value={application.createdAt ? new Date(application.createdAt).toLocaleString("en-IN") : "—"}
          />
          {application.rejectionReason && (
            <Row label="Rejection Reason" value={application.rejectionReason} />
          )}
        </div>

        {application.status === "pending" && (
          <div className="flex gap-3 p-5">
            <button
              onClick={() => setConfirmAction("approve")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Check size={16} /> Approve & Allot Slot
            </button>
            <button
              onClick={() => setConfirmAction("reject")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
            >
              <X size={16} /> Reject Application
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction === "approve" ? "Approve & Allot Slot?" : "Reject Application?"}
        description={
          confirmAction === "approve" ? (
            <>
              You are about to allot{" "}
              <strong>
                {formatDateLong(application.date)} · {sessionLabel(application.session)}
              </strong>
              . This slot will become unavailable for all other applicants.
            </>
          ) : (
            <>This application will be marked as rejected.</>
          )
        }
        confirmLabel={confirmAction === "approve" ? "Confirm & Allot" : "Reject"}
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
