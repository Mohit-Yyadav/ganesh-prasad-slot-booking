import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { adminDashboard } from "../../services/api";
import { LoadingState, ErrorState } from "../../components/States.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatDateLong, sessionLabel } from "../../utils/format.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    return adminDashboard()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (!silent) setError(err.message);
      })
      .finally(() => {
        if (!silent) setLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadData(false);

    // Auto-poll every 6 seconds silently
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, 6000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    };
    const onFocus = () => {
      loadData(true);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadData]);

  if (loading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  const { stats, recentApplications, upcomingSlots, fullyBookedDates } = data;

  const cards = [
    { label: "Total Applications", value: stats.totalApplications, icon: ClipboardList, cls: "bg-saffron-50 text-saffron-600" },
    { label: "Pending Verification", value: stats.pending, icon: Clock, cls: "bg-amber-50 text-amber-600" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, cls: "bg-red-50 text-red-600" },
    { label: "Available Slots", value: stats.availableSlots, icon: CalendarCheck, cls: "bg-maroon-50 text-maroon-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-maroon-900">Dashboard</h1>
          <p className="text-sm font-medium text-maroon-800 mt-0.5">
            {stats.todaysApplications} application{stats.todaysApplications === 1 ? "" : "s"} received today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Auto-Sync</span>
            {isRefreshing && (
              <span className="text-[10px] text-amber-600 font-mono animate-pulse">· Syncing...</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-maroon-700 hover:text-maroon-900 hover:bg-saffron-100 border border-saffron-300 transition active:scale-95 disabled:opacity-50"
            title="Refresh dashboard now"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-card">
            <span className={`grid h-10 w-10 place-items-center rounded-full ${c.cls}`}>
              <c.icon size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold text-maroon-900">{c.value}</p>
            <p className="text-xs font-bold text-maroon-800 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-card text-maroon-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-lg text-maroon-900">Recent Applications</h2>
            <Link to="/admin/applications" className="flex items-center gap-1 text-sm font-bold text-saffron-700 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-saffron-100">
            {recentApplications.length === 0 && (
              <p className="py-6 text-center text-sm font-medium text-maroon-700">No applications yet.</p>
            )}
            {recentApplications.map((a) => (
              <Link
                key={a.id}
                to={`/admin/applications/${a.id}`}
                className="flex items-center justify-between gap-3 py-3 px-2 rounded-xl hover:bg-cream-50 transition border border-transparent hover:border-saffron-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-maroon-900">{a.name}</p>
                    <span className="text-xs font-mono font-bold text-maroon-900 bg-cream-100 px-2 py-0.5 rounded border border-saffron-300">
                      {a.mobile}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-maroon-800">
                    <span className="font-bold text-maroon-900">📅 {formatDateLong(a.date)}</span>
                    <span className="text-gray-400">·</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      a.session === "morning"
                        ? "bg-amber-100 text-amber-950 border border-amber-300"
                        : "bg-purple-100 text-purple-950 border border-purple-300"
                    }`}>
                      {a.session === "morning" ? "☀️ Morning" : "🌙 Evening"}
                    </span>
                    {a.prasadItem && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-amber-900 font-bold">🍱 {a.prasadItem}</span>
                      </>
                    )}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-card text-maroon-900">
          <h2 className="mb-4 font-bold text-lg text-maroon-900">Upcoming Available Slots</h2>
          <div className="divide-y divide-saffron-100">
            {upcomingSlots.length === 0 && (
              <p className="py-6 text-center text-sm font-medium text-maroon-700">No available slots.</p>
            )}
            {upcomingSlots.map((s) => (
              <div key={s._id} className="flex items-center justify-between py-3">
                <p className="text-sm font-bold text-maroon-900">📅 {formatDateLong(s.date)}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                  s.session === "morning"
                    ? "bg-amber-100 text-amber-950 border-amber-300"
                    : "bg-purple-100 text-purple-950 border-purple-300"
                }`}>
                  {s.session === "morning" ? "☀️ Morning" : "🌙 Evening"}
                </span>
              </div>
            ))}
          </div>

          {fullyBookedDates.length > 0 && (
            <div className="mt-4 rounded-xl bg-cream-100 p-3 border border-saffron-200">
              <p className="text-xs font-bold text-maroon-900">Fully Booked Dates</p>
              <p className="mt-1 text-xs font-medium text-maroon-800">
                {fullyBookedDates.map((d) => formatDateLong(d)).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
