export function formatDateLong(isoDate) {
  // isoDate: "2026-09-18"
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDayNumber(isoDate) {
  const [, , d] = isoDate.split("-").map(Number);
  return d;
}

export function formatMonthShort(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", { month: "long" }).toUpperCase();
}

export function formatWeekday(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", { weekday: "long" });
}

export function sessionLabel(session) {
  return session === "morning" ? "Morning" : "Evening";
}

export function maskMobile(mobile) {
  if (!mobile || mobile.length < 4) return mobile;
  return `${"X".repeat(mobile.length - 4)}${mobile.slice(-4)}`;
}
