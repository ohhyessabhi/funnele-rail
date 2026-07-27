import { CLOSED_STATUSES, STALE_DAYS, COLORS } from "./constants";

/** Local, client-only id used only for optimistic rows before the server responds. */
export const uid = (prefix = "id") =>
  prefix + Math.random().toString(36).slice(2, 7);

export const initials = (name) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Whole days elapsed since an ISO timestamp string (e.g. tasks.status_at). */
export const ageDays = (timestamp) => {
  if (!timestamp) return 0;
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 864e5);
};

/** Signed days from today to a YYYY-MM-DD date string (negative = overdue). */
export const daysTo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(today() + "T00:00:00");
  return Math.round((d - t) / 864e5);
};

export const shortDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const dueLabel = (dateStr) => {
  const n = daysTo(dateStr);
  if (n === null) return { txt: "", cls: "" };
  if (n < 0) return { txt: -n + "d late", cls: "alert" };
  if (n === 0) return { txt: "today", cls: "alert" };
  if (n === 1) return { txt: "tmrw", cls: "" };
  return { txt: shortDate(dateStr), cls: "" };
};

export const isClosed = (task) => CLOSED_STATUSES.includes(task.status);

export const isStale = (task) =>
  !isClosed(task) && ageDays(task.status_at) > STALE_DAYS;

/** Left-edge spine color: calm -> amber (aging) -> red (stale). */
export const spine = (task) => {
  if (isClosed(task)) return "transparent";
  const a = ageDays(task.status_at);
  if (a > STALE_DAYS) return COLORS.alert;
  if (a > 2) return COLORS.growth;
  return COLORS.calm;
};

export const commentTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
