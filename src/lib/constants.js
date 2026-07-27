/**
 * Funnele PM — shared constants
 */

export const ROLES = [
  "Admin",
  "PM",
  "SEO",
  "Web Designer",
  "Web Developer",
  "Email Marketing",
  "Google Ads",
  "Meta Ads",
];

export const ROLE_SHORT = {
  Admin: "ADMIN",
  PM: "PM",
  SEO: "SEO",
  "Web Designer": "DSGN",
  "Web Developer": "DEV",
  "Email Marketing": "EMAIL",
  "Google Ads": "GADS",
  "Meta Ads": "META",
};

export const STATUSES = [
  "Backlog",
  "Ready",
  "In Progress",
  "Client Review",
  "Approved",
  "Completed",
  "Revision Required",
];

export const STATUS_SHORT = {
  Backlog: "BKLG",
  Ready: "RDY",
  "In Progress": "PROG",
  "Client Review": "C-REV",
  Approved: "APPR",
  Completed: "DONE",
  "Revision Required": "REVSN",
};

export const CLOSED_STATUSES = ["Completed"];
export const WAITING_STATUSES = ["Client Review"];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

export const PRIORITY_TAG = {
  Low: "LOW",
  Normal: "NRM",
  High: "HIGH",
  Urgent: "URG",
};

export const PRIORITY_ORDER = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  Low: 3,
};

export const PROJECT_STATES = ["Active", "Paused", "Cancelled"];

export const STALE_DAYS = 5;

export const COLORS = {
  accent: "#d946ef",
  accentLight: "#f0d9ff",
  accentDark: "#c026d3",
  growth: "#f59e0b",
  success: "#10b981",
  alert: "#ef4444",
  calm: "#d1cfe3",
};
