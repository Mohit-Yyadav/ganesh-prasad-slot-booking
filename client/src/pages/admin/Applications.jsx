import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Search, Download, ChevronLeft, ChevronRight, Eye, Check, X, Calendar } from "lucide-react";
import { adminListApplications, adminApprove, adminReject, api } from "../../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../../components/States.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import RescheduleModal from "../../components/RescheduleModal.jsx";
import { formatDateLong, sessionLabel, maskMobile } from "../../utils/format.js";

export default function Applications() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [confirmTarget, setConfirmTarget] = useState(null); // { app, action }
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleApp, setRescheduleApp] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListApplications({ search: debouncedSearch, status, sort, page, limit: 10 })
      .then((data) => {
        setItems(data.applications);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sort]);

  async function handleConfirmAction() {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      if (confirmTarget.action === "approve") {
        await adminApprove(confirmTarget.app.id);
        toast.success("Application approved and slot allotted.");
      } else {
        await adminReject(confirmTarget.app.id);
        toast.success(
          confirmTarget.action === "revoke"
            ? "Allotment revoked and slot made available again."
            : "Application rejected."
        );
      }
      setConfirmTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExport() {
    try {
      const res = await api.get("/admin/applications/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-maroon-800">Applications</h1>
          <p className="text-sm text-maroon-700/70">
            Verify and allot slots to devotees. One slot per session guaranteed.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-saffron-200 bg-white px-4 text-sm font-semibold text-maroon-800 shadow-sm hover:bg-cream-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, or Application ID..."
            className="min-h-[44px] w-full rounded-xl border border-saffron-200 bg-white pl-10 pr-4 text-sm text-maroon-900 placeholder:text-gray-400 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500 outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-[44px] rounded-lg border border-saffron-200 bg-white text-maroon-900 px-3 text-sm font-medium"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="min-h-[44px] rounded-lg border border-saffron-200 bg-white text-maroon-900 px-3 text-sm font-medium"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="date">By Slot Date</option>
        </select>
      </div>

      {loading ? (
        <LoadingState label="Loading applications..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No applications found" description="Try adjusting your search or filter." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-card md:block text-maroon-900">
            <table className="w-full text-left text-sm text-maroon-900">
              <thead className="bg-cream-100 text-xs uppercase tracking-wide text-maroon-900 border-b border-saffron-200 font-bold">
                <tr>
                  <th className="px-4 py-3.5 text-maroon-900 font-bold">Application ID</th>
                  <th className="px-4 py-3.5 text-maroon-900 font-bold">Name & Prasad</th>
                  <th className="px-4 py-3.5 text-maroon-900 font-bold">Mobile</th>
                  <th className="px-4 py-3.5 text-maroon-900 font-bold">Date</th>
                  <th className="px-4 py-3.5 text-maroon-900 font-bold">Session</th>
                  <th className="px-4 py-3.5 text-maroon-900 font-bold">Status</th>
                  <th className="px-4 py-3.5 text-right text-maroon-900 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-100">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-maroon-900">{a.applicationId}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-maroon-900">{a.name}</div>
                      {a.prasadItem ? (
                        <div className="text-xs text-amber-800 font-medium truncate max-w-[200px]" title={a.prasadItem}>
                          🍱 {a.prasadItem}
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic">No prasad specified</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-sm font-semibold text-maroon-950 select-all">
                      {a.mobile}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-maroon-950">
                      {formatDateLong(a.date)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-maroon-950">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        a.session === "morning"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-purple-100 text-purple-900 border border-purple-300"
                      }`}>
                        {a.session === "morning" ? "☀️ Morning" : "🌙 Evening"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/applications/${a.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-maroon-300 text-maroon-800 hover:bg-maroon-50"
                          aria-label="View"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => setRescheduleApp(a)}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-500 transition"
                          title="Change / Reschedule Slot"
                          aria-label="Change Slot"
                        >
                          <Calendar size={16} className="text-amber-800" />
                        </button>
                        {a.status === "pending" && (
                          <>
                            <button
                              onClick={() => setConfirmTarget({ app: a, action: "approve" })}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              title="Approve & Allot"
                              aria-label="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmTarget({ app: a, action: "reject" })}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                              title="Reject Application"
                              aria-label="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {a.status === "approved" && (
                          <button
                            onClick={() => setConfirmTarget({ app: a, action: "revoke" })}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                            title="Revoke allotment & release slot"
                            aria-label="Revoke"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((a) => (
              <div key={a.id} className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-card text-maroon-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-saffron-700">{a.applicationId}</p>
                    <p className="mt-0.5 font-bold text-maroon-900 text-base">{a.name}</p>
                    <p className="text-sm font-mono font-bold text-maroon-950 mt-0.5">{a.mobile}</p>
                    {a.prasadItem && (
                      <p className="text-xs text-amber-800 mt-1 font-medium">🍱 {a.prasadItem}</p>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-sm font-medium text-maroon-950">
                  <span>📅 {formatDateLong(a.date)}</span>
                  <span>·</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    a.session === "morning"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-purple-100 text-purple-900 border border-purple-300"
                  }`}>
                    {a.session === "morning" ? "☀️ Morning" : "🌙 Evening"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/admin/applications/${a.id}`}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-maroon-200 text-sm font-semibold text-maroon-700"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setRescheduleApp(a)}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 text-sm font-semibold text-amber-950 hover:bg-amber-100 transition"
                  >
                    <Calendar size={15} className="text-amber-800" /> Reschedule
                  </button>
                  {a.status === "pending" && (
                    <>
                      <button
                        onClick={() => setConfirmTarget({ app: a, action: "approve" })}
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirmTarget({ app: a, action: "reject" })}
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-red-600 text-sm font-semibold text-white"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {a.status === "approved" && (
                    <button
                      onClick={() => setConfirmTarget({ app: a, action: "revoke" })}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-red-600 text-sm font-semibold text-white"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="flex min-h-[44px] items-center gap-1 rounded-lg border border-saffron-300 bg-white px-3 text-sm font-semibold text-maroon-900 hover:bg-cream-100 disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <p className="text-sm font-semibold text-maroon-900">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="flex min-h-[44px] items-center gap-1 rounded-lg border border-saffron-300 bg-white px-3 text-sm font-semibold text-maroon-900 hover:bg-cream-100 disabled:opacity-40 transition"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      <RescheduleModal
        open={!!rescheduleApp}
        application={rescheduleApp}
        onClose={() => setRescheduleApp(null)}
        onSuccess={() => load()}
      />

      <ConfirmModal
        open={!!confirmTarget}
        title={
          confirmTarget?.action === "approve"
            ? "Approve & Allot Slot?"
            : confirmTarget?.action === "revoke"
            ? "Revoke Allotment & Release Slot?"
            : "Reject Application?"
        }
        description={
          confirmTarget?.action === "approve" ? (
            <>
              You are about to allot{" "}
              <strong>
                {confirmTarget && formatDateLong(confirmTarget.app.date)} ·{" "}
                {confirmTarget && sessionLabel(confirmTarget.app.session)}
              </strong>{" "}
              to <strong>{confirmTarget?.app.name}</strong>. This slot will become unavailable
              for all other applicants.
            </>
          ) : confirmTarget?.action === "revoke" ? (
            <>
              Are you sure you want to revoke this allotment? The slot will become <strong>Available</strong> again for new bookings, and this application will be marked as rejected.
            </>
          ) : (
            <>This application will be marked as rejected.</>
          )
        }
        confirmLabel={
          confirmTarget?.action === "approve"
            ? "Confirm & Allot"
            : confirmTarget?.action === "revoke"
            ? "Revoke Allotment"
            : "Reject"
        }
        tone={confirmTarget?.action === "approve" ? "primary" : "danger"}
        loading={actionLoading}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
