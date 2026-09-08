import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Search, Download, ChevronLeft, ChevronRight, Eye, Check, X } from "lucide-react";
import { adminListApplications, adminApprove, adminReject, api } from "../../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../../components/States.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
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
        toast.success("Application rejected.");
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
    } catch {
      toast.error("Could not export data. Please try again.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-maroon-800">Applications</h1>
          <p className="text-sm text-maroon-700/70">{pagination.totalCount ?? 0} total applications</p>
        </div>
        <button
          onClick={handleExport}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-maroon-200 bg-white px-4 text-sm font-semibold text-maroon-700 hover:bg-maroon-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-maroon-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile or application ID"
            className="min-h-[44px] w-full rounded-lg border border-saffron-200 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-[44px] rounded-lg border border-saffron-200 px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="min-h-[44px] rounded-lg border border-saffron-200 px-3 text-sm"
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
        <EmptyState title="No pending applications" description="You're all caught up." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-100 text-xs uppercase tracking-wide text-maroon-700/70">
                <tr>
                  <th className="px-4 py-3">Application ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-100">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-medium text-maroon-800">{a.applicationId}</td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3">{maskMobile(a.mobile)}</td>
                    <td className="px-4 py-3">{formatDateLong(a.date)}</td>
                    <td className="px-4 py-3">{sessionLabel(a.session)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/applications/${a.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-maroon-200 text-maroon-700 hover:bg-maroon-50"
                          aria-label="View"
                        >
                          <Eye size={16} />
                        </Link>
                        {a.status === "pending" && (
                          <>
                            <button
                              onClick={() => setConfirmTarget({ app: a, action: "approve" })}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              aria-label="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmTarget({ app: a, action: "reject" })}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                              aria-label="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
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
              <div key={a.id} className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-saffron-600">{a.applicationId}</p>
                    <p className="mt-0.5 font-semibold text-maroon-800">{a.name}</p>
                    <p className="text-sm text-maroon-700/70">{maskMobile(a.mobile)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-2 text-sm text-maroon-700/80">
                  {formatDateLong(a.date)} · {sessionLabel(a.session)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/admin/applications/${a.id}`}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-maroon-200 text-sm font-semibold text-maroon-700"
                  >
                    View
                  </Link>
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
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="flex min-h-[44px] items-center gap-1 rounded-lg border border-saffron-200 bg-white px-3 text-sm font-medium text-maroon-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <p className="text-sm text-maroon-700/70">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="flex min-h-[44px] items-center gap-1 rounded-lg border border-saffron-200 bg-white px-3 text-sm font-medium text-maroon-700 disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!confirmTarget}
        title={
          confirmTarget?.action === "approve"
            ? "Approve & Allot Slot?"
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
          ) : (
            <>This application will be marked as rejected and the applicant will be notified.</>
          )
        }
        confirmLabel={confirmTarget?.action === "approve" ? "Confirm & Allot" : "Reject"}
        tone={confirmTarget?.action === "approve" ? "primary" : "danger"}
        loading={actionLoading}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
