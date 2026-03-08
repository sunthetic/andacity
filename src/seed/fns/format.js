// @ts-nocheck
export const slugify = (value) => {
  return String(value || "")
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
};

export const titleCase = (value) => {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

export const toIsoDate = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const parseIsoDate = (value) => {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addDays = (date, days) => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const dayDiff = (a, b) => {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000);
};

export const toClock = (totalMinutes) => {
  const minutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

export const normalizeMinutes = (value) => {
  return ((Math.round(value) % 1440) + 1440) % 1440;
};

export const windowFromMinutes = (minutes) => {
  const value = normalizeMinutes(minutes);
  if (value >= 300 && value < 720) return "morning";
  if (value >= 720 && value < 1020) return "afternoon";
  if (value >= 1020 && value < 1320) return "evening";
  return "overnight";
};

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const clamp = (value, min, max) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};
