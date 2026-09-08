import React from "react";
import { Clock, CheckCircle2, XCircle, Lock, CircleDot, Ban } from "lucide-react";

const CONFIG = {
  pending: { label: "Pending Verification", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Not Approved", icon: XCircle, cls: "bg-red-50 text-red-700 border-red-200" },
  available: { label: "Available", icon: CircleDot, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  allotted: { label: "Already Allotted", icon: Lock, cls: "bg-maroon-50 text-maroon-700 border-maroon-200" },
  closed: { label: "Closed", icon: Ban, cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function StatusBadge({ status, className = "" }) {
  const cfg = CONFIG[status] || CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls} ${className}`}
    >
      <Icon size={14} />
      {cfg.label}
    </span>
  );
}
