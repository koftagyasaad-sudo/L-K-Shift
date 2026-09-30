export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: Date | string | null | undefined, locale = "en") {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, locale = "en") {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatMinutesAsHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
