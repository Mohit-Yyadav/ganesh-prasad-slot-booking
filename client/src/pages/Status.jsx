import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowLeft,
  X,
  Edit3,
} from "lucide-react";
import { fetchApplicationStatus } from "../services/api";
import { formatDateLong, sessionLabel } from "../utils/format";
import { ErrorState } from "../components/States";

function normalizeApplicationId(raw) {
  const s = (raw || "").trim();
  if (!s) return "";

  // If user only typed digits, e.g. "1" or "000001"
  if (/^\d+$/.test(s)) {
    return `GP-2026-${s.padStart(6, "0")}`;
  }

  // If user typed "GP-2026-1" or "gp-2026-1" with less than 6 digits
  const match = s.match(/^(GP-\d{4}-)(\d+)$/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    if (num.length < 6) {
      return `${prefix}${num.padStart(6, "0")}`;
    }
    return `${prefix}${num}`;
  }

  return s.toUpperCase();
}

export default function Status() {
  const location = useLocation();
  const inputRef = useRef(null);

  // Pre-filled with "GP-2026-000001" by default, or router preset
  const [applicationId, setApplicationId] = useState(
    location.state?.presetApplicationId || "GP-2026-000001"
  );
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
    const targetId = normalizeApplicationId(applicationId);
    if (!targetId) return;

    // Update input display to normalized format
    setApplicationId(targetId);
    setLoading(true);
    setError(null);
    setApplication(null);

    try {
      const data = await fetchApplicationStatus({ applicationId: targetId });
      setApplication(data.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputFocus(e) {
    // Automatically position cursor at the end when user clicks/focuses
    const val = e.target.value;
    e.target.setSelectionRange(val.length, val.length);
  }

  return (
    <div className="mx-auto max-w-xl px-3 py-6 sm:py-12 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400">
        Check Application Status
      </h1>
      <p className="mt-1.5 text-xs sm:text-sm text-amber-200/70">
        Enter your Application ID to view your Prasad Seva status.
      </p>

      {/* ── Search Form ────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="mt-5 sm:mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="e.g. GP-2026-000001"
            className="min-h-[52px] w-full rounded-xl border border-amber-400/30 bg-white/5 px-4 pr-10 font-mono text-base sm:text-lg font-bold text-white tracking-wide placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition"
          />
          {applicationId && (
            <button
              type="button"
              onClick={() => {
                setApplicationId("GP-2026-");
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(8, 8);
                  }
                }, 10);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-amber-300/60 hover:text-white rounded-lg transition"
              title="Reset to prefix GP-2026-"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !applicationId.trim()}
          className="btn-gold-3d flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Search
        </button>
      </form>

      {/* ── Quick Options & Edit Helpers ────────────────────────── */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-amber-200/60 font-medium">Quick helpers:</span>
        <button
          type="button"
          onClick={() => {
            setApplicationId("GP-2026-");
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(8, 8);
              }
            }, 10);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-amber-400/20 text-amber-200 font-mono transition"
        >
          <Edit3 size={12} />
          <span>Edit Prefix: GP-2026-</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setApplicationId("GP-2026-000001");
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(14, 14);
              }
            }, 10);
          }}
          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono font-semibold transition"
        >
          GP-2026-000001
        </button>
      </div>

      {/* ── Results Display ────────────────────────────────────── */}
      <div className="mt-8">
        {error && <ErrorState message={error} />}

        {application && (
          <div className="animate-fadeIn overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-b from-maroon-900/60 to-black/85 backdrop-blur-md shadow-2xl">
            <div className="border-b border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Application Found
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold text-white">
                {application.applicationId}
              </p>
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
                    <p className="text-sm text-emerald-200/90">
                      Your slot has been successfully verified &amp; allotted.
                    </p>
                  </div>
                </div>
              )}

              {application.status === "rejected" && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-red-200 shadow-md">
                  <XCircle size={22} className="mt-0.5 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-300">Application Not Approved</p>
                    <p className="text-sm text-red-200/90">
                      {application.rejectionReason ||
                        "This slot was allotted to another applicant."}
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
