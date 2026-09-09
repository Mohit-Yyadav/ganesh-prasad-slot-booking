import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/slots", label: "Slot Management", icon: CalendarRange },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="px-5 py-5 border-b border-white/10 space-y-2">
          <div className="bg-white rounded-xl p-2.5 flex items-center justify-center shadow-sm">
            <img src="/company-logo.png" alt="Codes for Tomorrow" className="h-7 w-auto object-contain" />
          </div>
          <div className="pt-1">
            <p className="text-xs font-bold text-amber-300 tracking-wide">GANESH PRASAD PORTAL</p>
            <p className="text-[11px] text-white/60">Admin Management</p>
          </div>
        </div>

        <nav className="space-y-1.5 px-3 py-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-xl px-4 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/15 text-white font-semibold shadow-xs"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3.5 bg-maroon-900/50">
        <div className="mb-2 px-3 py-1 text-xs font-mono text-amber-200/80 truncate">
          {admin?.email}
        </div>
        <button
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl px-4 text-sm font-semibold text-red-200 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 hover:text-white transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Desktop sidebar - sticky so it stays visible while scrolling, Logout button always visible */}
      <aside className="hidden w-64 flex-shrink-0 bg-maroon-800 md:block sticky top-0 h-screen z-30 shadow-xl overflow-hidden">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-maroon-800 shadow-2xl h-full overflow-hidden">
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-saffron-100 bg-white px-4 md:hidden">
          <span className="font-display font-semibold text-maroon-800">Admin Panel</span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-lg text-maroon-800"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
