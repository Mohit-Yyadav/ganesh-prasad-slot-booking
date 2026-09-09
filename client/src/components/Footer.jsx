import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid rgba(61,16,32,0.5)",
        background: "rgba(14,2,5,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/95 rounded-lg px-2 py-1 flex items-center shadow-sm">
              <img src="/company-logo.png" alt="Codes for Tomorrow" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-gold-400/30">|</span>
            <div className="flex items-center gap-2">
              <div className="relative h-7 w-7 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-orange-500 shadow-md flex items-center justify-center">
                <img src="/ganesh-3d.png" alt="Ganesh Ji" className="h-full w-full object-contain rounded-full" />
              </div>
              <span className="font-display text-sm font-semibold" style={{ color: "#e5c158" }}>
                Shree Ganesh Utsav 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {[
              { to: "/",       label: "Home" },
              { to: "/book",   label: "Book Slot" },
              { to: "/status", label: "Check Status" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm transition-colors"
                style={{ color: "rgba(253,246,232,0.45)" }}
                onMouseEnter={(e) => (e.target.style.color = "#e5c158")}
                onMouseLeave={(e) => (e.target.style.color = "rgba(253,246,232,0.45)")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="gold-divider mt-6 max-w-lg" />

        <p className="mt-4 text-center text-xs" style={{ color: "rgba(253,246,232,0.4)" }}>
          Organized with devotion by <strong style={{ color: "#e5c158" }}>Codes for Tomorrow</strong> · Ganpati Bappa Morya 🙏
        </p>
      </div>
    </footer>
  );
}
