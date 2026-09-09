import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Search, Loader2, CheckCircle2, XCircle, Circle, ArrowLeft } from "lucide-react";
import { fetchApplicationStatus } from "../services/api";
import { formatDateLong, sessionLabel } from "../utils/format";
import { ErrorState } from "../components/States";

export default function Status() {
  const location = useLocation();
  const [applicationId, setApplicationId] = useState(location.state?.presetApplicationId || "");
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.presetApplicationId) {
      const id = location.state.presetApplicationId.trim();
      setApplicationId(id);
      setLoading(true);
      setError(null);
      fetchApplicationStatus({ applicationId: id })
        .then((data) => setApplication(data.application))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [location.state?.presetApplicationId]);

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!applicationId.trim()) return;
    setLoading(true);
    setError(null);
    setApplication(null);
    try {
      const data = await fetchApplicationStatus({ applicationId: applicationId.trim() });
      setApplication(data.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-3 py-6 sm:py-12 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400">
        Check Application Status
      </h1>
      <p className="mt-1.5 text-xs sm:text-sm text-amber-200/70">
        Enter your Application ID to view your Prasad Seva status.
      </p>

      <form onSubmit={handleSearch} className="mt-5 sm:mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
          placeholder="e.g. GP-2026-000123"
          className="min-h-[52px] flex-1 rounded-xl border border-amber-400/30 bg-white/5 px-4 text-base text-white placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition"
        />
        <button
          type="submit"
          disabled={loading || !applicationId.trim()}
          className="btn-gold-3d flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Search
        </button>
      </form>

      <div className="mt-8">
        {error && <ErrorState message={error} />}

        {application && (
          <div className="animate-fadeIn overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-b from-maroon-900/60 to-black/85 backdrop-blur-md shadow-2xl">
            <div className="border-b border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Application Found</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-white">{application.applicationId}</p>
            </div>

            <div className="divide-y divide-white/10">
              <Row label="Name" value={application.name} />
              <Row label="Date" value={formatDateLong(application.date)} />
              <Row label="Session" value={sessionLabel(application.session)} />
              {application.prasadItem && (
                <Row label="Prasad Item" value={application.prasadItem} />
              )}
              {application.prasadDeliveryMode && (
                <Row label="Delivery Mode" value={application.prasadDeliveryMode} />
              )}
              <Row
                label="Office Timing Deadline"
                value={application.session === "morning" ? "By 9:00 AM" : "By 6:00 PM"}
              />
            </div>

            <div className="px-5 py-5 border-t border-white/10">
              <p className="mb-3 text-sm font-semibold text-amber-200">Current Progress</p>
              <Timeline status={application.status} />

              {application.status === "approved" && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-emerald-200 shadow-md">
                  <CheckCircle2 size={22} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-300">Slot Allotted</p>
                    <p className="text-sm text-emerald-200/90">Your slot has been successfully verified &amp; allotted.</p>
                  </div>
                </div>
              )}

              {application.status === "rejected" && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-red-200 shadow-md">
                  <XCircle size={22} className="mt-0.5 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-300">Application Not Approved</p>
                    <p className="text-sm text-red-200/90">
                      {application.rejectionReason || "This slot was allotted to another applicant."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-amber-300/80 hover:text-amber-200 transition font-medium"
          >
            <ArrowLeft size={16} /> Back to Prasad Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-amber-100/60">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function Timeline({ status }) {
  const steps = [
    { key: "submitted", label: "Application Submitted", done: true },
    { key: "review", label: "Under Verification", done: true },
    {
      key: "final",
      label: status === "rejected" ? "Application Not Approved" : "Slot Allotted",
      done: status === "approved" || status === "rejected",
    },
  ];

  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-3">
          {s.done ? (
            <CheckCircle2
              size={18}
              className={status === "rejected" && i === 2 ? "text-red-400" : "text-emerald-400"}
            />
          ) : (
            <Circle size={18} className="text-amber-400/40" />
          )}
          <span className={`text-sm ${s.done ? "text-white font-medium" : "text-gray-400"}`}>
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
