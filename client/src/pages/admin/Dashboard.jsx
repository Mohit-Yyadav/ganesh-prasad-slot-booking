import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { adminDashboard } from "../../services/api";
import { LoadingState, ErrorState } from "../../components/States.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatDateLong, sessionLabel } from "../../utils/format.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-maroon-800">Dashboard</h1>
        <p className="text-sm text-maroon-700/70">
          {stats.todaysApplications} application{stats.todaysApplications === 1 ? "" : "s"} received today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-card">
            <span className={`grid h-10 w-10 place-items-center rounded-full ${c.cls}`}>
              <c.icon size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold text-maroon-800">{c.value}</p>
            <p className="text-xs text-maroon-700/70">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-maroon-800">Recent Applications</h2>
            <Link to="/admin/applications" className="flex items-center gap-1 text-sm font-medium text-saffron-600 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-saffron-100">
            {recentApplications.length === 0 && (
              <p className="py-6 text-center text-sm text-maroon-700/60">No applications yet.</p>
            )}
            {recentApplications.map((a) => (
              <Link
                key={a.id}
                to={`/admin/applications/${a.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:bg-cream-50"
              >
                <div>
                  <p className="text-sm font-medium text-maroon-800">{a.name}</p>
                  <p className="text-xs text-maroon-700/60">
                    {formatDateLong(a.date)} · {sessionLabel(a.session)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-maroon-800">Upcoming Available Slots</h2>
          <div className="divide-y divide-saffron-100">
            {upcomingSlots.length === 0 && (
              <p className="py-6 text-center text-sm text-maroon-700/60">No available slots.</p>
            )}
            {upcomingSlots.map((s) => (
              <div key={s._id} className="flex items-center justify-between py-3">
                <p className="text-sm font-medium text-maroon-800">{formatDateLong(s.date)}</p>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {sessionLabel(s.session)}
                </span>
              </div>
            ))}
          </div>

          {fullyBookedDates.length > 0 && (
            <div className="mt-4 rounded-xl bg-cream-100 p-3">
              <p className="text-xs font-semibold text-maroon-700">Fully Booked Dates</p>
              <p className="mt-1 text-xs text-maroon-700/70">
                {fullyBookedDates.map((d) => formatDateLong(d)).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
