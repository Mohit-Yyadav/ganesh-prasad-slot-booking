import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/book", label: "Book Slot" },
  { to: "/status", label: "Check Status" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(14,2,5,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(61,16,32,0.6)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo & Company Branding */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-h-[44px]" onClick={() => setOpen(false)}>
          <div className="bg-white/95 rounded-lg px-2 sm:px-2.5 py-1 flex items-center shadow-sm border border-gold-400/30">
            <img src="/company-logo.png" alt="Codes for Tomorrow" className="h-6 sm:h-7 w-auto object-contain" />
          </div>
          <span className="hidden sm:inline-block text-gold-400/30 font-light">|</span>
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-orange-500 shadow-md flex items-center justify-center">
              <img src="/ganesh-3d.png" alt="Ganesh Ji" className="h-full w-full object-contain rounded-full" />
            </div>
            <span className="font-display text-sm sm:text-base font-bold tracking-wide" style={{ color: "#fef08a" }}>
              Shree Ganesh Utsav
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive
                  ? "text-gold-400"
                  : "text-cream-100/70 hover:text-cream-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/admin/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{
              background: "rgba(255,248,240,0.06)",
              border: "1px solid rgba(229,193,88,0.2)",
              color: "rgba(229,193,88,0.8)",
            }}
          >
            Admin
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="grid h-11 w-11 place-items-center rounded-lg md:hidden"
          style={{ color: "#e5c158" }}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="px-4 pb-4 pt-1 md:hidden"
          style={{ borderTop: "1px solid rgba(61,16,32,0.5)", background: "rgba(14,2,5,0.95)" }}
        >
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block min-h-[44px] rounded-lg px-3 py-3 text-base font-medium transition-colors ${isActive ? "text-gold-400" : "text-cream-100/70"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/admin/login"
            onClick={() => setOpen(false)}
            className="block min-h-[44px] rounded-lg px-3 py-3 text-base font-medium"
            style={{ color: "rgba(229,193,88,0.7)" }}
          >
            Admin Login
          </Link>
        </nav>
      )}
    </header>
  );
}
