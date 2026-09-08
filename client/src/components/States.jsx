import React from "react";

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="h-10 w-10 rounded-full border-2 border-transparent animate-spin"
        style={{
          borderTopColor: "#e5c158",
          borderRightColor: "rgba(229,193,88,0.3)",
        }}
      />
      <p style={{ color: "rgba(253,246,232,0.4)", fontSize: "0.88rem" }}>{label}</p>
    </div>
  );
}

export function EmptyState({ label = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-4xl">🙏</span>
      <p style={{ color: "rgba(253,246,232,0.4)", fontSize: "0.88rem" }}>{label}</p>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong. Please try again." }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4 mb-4"
      style={{
        background: "rgba(154,45,45,0.12)",
        border: "1px solid rgba(154,45,45,0.3)",
      }}
    >
      <span className="text-lg flex-shrink-0">⚠️</span>
      <p style={{ color: "#fca5a5", fontSize: "0.88rem" }}>{message}</p>
    </div>
  );
}
