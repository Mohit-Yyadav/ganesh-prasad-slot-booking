import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllSlots } from "../services/api";

const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_SHORT   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function SlotRow({ label, slot, date }) {
  const status = slot?.status || "available";
  const isAllotted = status === "allotted" || status === "booked";
  const isPending  = status === "pending";
  const isClosed   = status === "closed";
  const name       = slot?.applicantName || slot?.name || "";

  return (
    <div className="session-row">
      <span
        className="session-dot"
        style={{
          background: isAllotted ? "#f97316" : isClosed ? "#9a2d2d" : isPending ? "#6b7280" : "#e5c158",
          boxShadow: isAllotted
            ? "0 0 10px rgba(249,115,22,0.8)"
            : isClosed || isPending
            ? "none"
            : "0 0 8px rgba(229,193,88,0.6)",
        }}
      />
      <span
        className="text-xs font-medium flex-1 truncate"
        style={{ color: "rgba(253,246,232,0.8)" }}
      >
        {label}
      </span>
      {isAllotted && name ? (
        <span
          className="badge-devotee-3d text-xs truncate max-w-[130px] px-2.5 py-1 text-right"
          title={name}
        >
          {name}
        </span>
      ) : isAllotted ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/40 text-orange-400">
          Allotted
        </span>
      ) : isClosed ? (
        <span className="text-xs font-medium text-red-400">
          Closed
        </span>
      ) : isPending ? (
        <span className="text-xs font-medium text-gray-400">
          Pending
        </span>
      ) : (
        <span className="text-xs font-semibold text-amber-300">
          Available
        </span>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="date-card p-5" style={{ opacity: 0.6 }}>
      <div className="skeleton h-5 w-24 mb-3" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-full" />
    </div>
  );
}

export default function Home() {
  const [dates, setDates]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    getAllSlots()
      .then((data) => setDates(data.dates || []))
      .catch(() => setError("Unable to load slots. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const totalBooked = dates.reduce((acc, d) => {
    if (d.morning?.status === "allotted" || d.morning?.status === "booked") acc++;
    if (d.evening?.status === "allotted" || d.evening?.status === "booked") acc++;
    return acc;
  }, 0);
  const totalSlots = dates.length * 2;
  const availableSlots = totalSlots - totalBooked;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* ── 3D Hero Header ──────────────────────────────────────────── */}
        <div className="text-center mb-10 sm:mb-12">
          {/* Company Initiative Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-white/10 via-white/15 to-white/10 backdrop-blur-md shadow-lg mb-5 border border-amber-400/30">
            <span className="text-[11px] font-bold text-amber-300 tracking-wider uppercase">Initiative by</span>
            <div className="bg-white rounded-md px-2 py-0.5 flex items-center shadow-sm">
              <img src="/company-logo.png" alt="Codes for Tomorrow" className="h-4 sm:h-5 w-auto object-contain" />
            </div>
          </div>

          {/* 3D Floating Lord Ganesha Centerpiece */}
          <div className="relative mx-auto w-28 h-28 sm:w-36 sm:h-36 mb-4 flex items-center justify-center">
            {/* Glowing aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/25 via-saffron-500/30 to-amber-300/10 blur-2xl animate-divine-pulse" />
            <div className="absolute -inset-3 rounded-full border border-amber-400/20 animate-glow-spin" />
            {/* 3D Ganesha Image */}
            <img
              src="/ganesh-3d.png"
              alt="Lord Ganesha"
              className="relative w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(229,193,88,0.5)] animate-float-3d rounded-2xl"
            />
          </div>

          {/* Title with metallic golden glow */}
          <h1
            className="font-display font-extrabold mb-2 tracking-wide"
            style={{
              fontSize: "clamp(2rem, 5.5vw, 3.2rem)",
              background: "linear-gradient(135deg, #fff7ed 0%, #fef08a 25%, #e5c158 50%, #f59e0b 80%, #d97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 18px rgba(229,193,88,0.3))",
            }}
          >
            Daily Prasad Seva
          </h1>

          <p
            className="text-sm sm:text-base mb-6 max-w-xl mx-auto px-4"
            style={{ color: "rgba(253,246,232,0.65)", letterSpacing: "0.02em" }}
          >
            Codes for Tomorrow · Devotee Prasad Seva Slot Allotment
          </p>

          {/* 3D Glass Stats Bar */}
          {!loading && totalSlots > 0 && (
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
              <div className="stat-card-3d text-center">
                <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300/80">Total Slots</p>
                <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalSlots}</p>
              </div>
              <div className="stat-card-3d text-center">
                <p className="text-[11px] font-medium uppercase tracking-wider text-orange-400">Allotted</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-400 mt-0.5">{totalBooked}</p>
              </div>
              <div className="stat-card-3d text-center">
                <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300">Available</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-300 mt-0.5">{availableSlots}</p>
              </div>
            </div>
          )}

          {/* 3D CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/book" className="btn-gold-3d w-full sm:w-auto">
              <span>Book Prasad Slot</span>
              <span className="text-lg">→</span>
            </Link>
            <Link to="/status" className="btn-saffron-3d w-full sm:w-auto">
              Check My Status
            </Link>
          </div>
        </div>

        {/* ── Date Grid (3D Interactive Cards) ─────────────────────────── */}
        {loading ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div
            className="text-center py-16"
            style={{ color: "rgba(253,246,232,0.45)" }}
          >
            <p className="text-2xl mb-3">⚠️</p>
            <p>{error}</p>
            <button
              className="btn-saffron-3d mt-4 mx-auto"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : dates.length === 0 ? (
          <div
            className="text-center py-16"
            style={{ color: "rgba(253,246,232,0.35)" }}
          >
            <p className="text-3xl mb-3">🙏</p>
            <p>No dates found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {dates.map((d, i) => {
              const dateObj = parseLocalDate(d.date);
              const dayNum  = dateObj.getDate();
              const mon     = MONTH_SHORT[dateObj.getMonth()];
              const weekday = WEEKDAY_SHORT[dateObj.getDay()];

              const mStatus = d.morning?.status || "available";
              const eStatus = d.evening?.status || "available";
              const mBooked = mStatus === "allotted" || mStatus === "booked";
              const eBooked = eStatus === "allotted" || eStatus === "booked";
              const allBooked = mBooked && eBooked;

              return (
                <Link
                  key={d.date}
                  to="/book"
                  state={{ presetDate: d.date }}
                  className="date-card p-5 block animate-fadeIn"
                  style={{ animationDelay: `${i * 0.03}s`, animationFillMode: "both" }}
                >
                  {/* Card header: date + weekday + FULL badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="font-display font-bold"
                        style={{
                          fontSize: "1.15rem",
                          color: "#fef08a",
                          textShadow: "0 2px 10px rgba(229,193,88,0.3)",
                        }}
                      >
                        {dayNum} {mon}
                      </span>
                      <span
                        className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(229,193,88,0.12)",
                          color: "rgba(254,240,138,0.8)",
                          border: "1px solid rgba(229,193,88,0.25)",
                        }}
                      >
                        {weekday}
                      </span>
                    </div>
                    {allBooked ? (
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, rgba(220,38,38,0.3), rgba(153,27,27,0.4))",
                          border: "1px solid rgba(239,68,68,0.4)",
                          color: "#fca5a5",
                        }}
                      >
                        FULL
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(234,179,8,0.1)",
                          color: "#fde047",
                          border: "1px solid rgba(234,179,8,0.25)",
                        }}
                      >
                        Open
                      </span>
                    )}
                  </div>

                  {/* Separator */}
                  <div
                    style={{
                      height: "1px",
                      background: "linear-gradient(90deg, rgba(229,193,88,0.3), rgba(61,16,32,0.6), transparent)",
                      marginBottom: "12px",
                    }}
                  />

                  {/* Session rows */}
                  <SlotRow label="Morning" slot={d.morning} date={d.date} />
                  <SlotRow label="Evening" slot={d.evening} date={d.date} />
                </Link>
              );
            })}
          </div>
        )}

        {/* ── 3D Legend ────────────────────────────────────────────────── */}
        {!loading && dates.length > 0 && (
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-6"
            style={{ fontSize: "0.8rem", color: "rgba(253,246,232,0.6)" }}
          >
            {[
              { color: "#e5c158", label: "Available", shadow: "0 0 10px rgba(229,193,88,0.6)" },
              { color: "#f97316", label: "Allotted (Devotee Name)", shadow: "0 0 10px rgba(249,115,22,0.6)" },
              { color: "#9a2d2d", label: "Closed", shadow: "none" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-2">
                <span
                  style={{
                    width: 12, height: 12, borderRadius: 4,
                    background: l.color, boxShadow: l.shadow,
                    display: "inline-block", flexShrink: 0,
                  }}
                />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
