import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary", // primary | danger
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmCls =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-gradient-to-r from-saffron-500 to-maroon-700 hover:opacity-95";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm animate-slideUp rounded-2xl bg-white p-6 shadow-2xl">
        <div className={`grid h-11 w-11 place-items-center rounded-full ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-saffron-50 text-saffron-600"}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-maroon-800">{title}</h2>
        {description && <div className="mt-2 text-sm text-maroon-700/80">{description}</div>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="min-h-[48px] flex-1 rounded-xl border border-maroon-200 text-sm font-semibold text-maroon-700 hover:bg-maroon-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-70 ${confirmCls}`}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
