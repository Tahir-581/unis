import type { Country } from "./types";

export function intakeLabel(season: string, year: number): string {
  if (season === "winter") return `Winter ${year}/${String(year + 1).slice(-2)}`;
  return `Summer ${year}`;
}

export function formatDeadline(date: string | null): string {
  if (!date) return "Not listed";
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatFee(amount: number | null, suffix = ""): string {
  if (amount === null || amount === undefined) return "Not listed";
  if (amount === 0) return "Free";
  return `€${amount.toLocaleString("en-EU", { maximumFractionDigits: 0 })}${suffix}`;
}

export function formatTuition(
  amount: number | null,
  period: string | null,
  original: string | null
): { primary: string; secondary: string | null } {
  if (original && !amount) {
    return { primary: original, secondary: null };
  }
  if (amount === 0 || period === "free") {
    return { primary: "Free", secondary: original };
  }
  if (amount === null) {
    return { primary: "Not listed", secondary: original };
  }
  const periodLabel =
    period === "per_semester" ? "/semester" : period === "per_year" ? "/year" : "";
  return {
    primary: `€${amount.toLocaleString("en-EU", { maximumFractionDigits: 0 })}${periodLabel}`,
    secondary: original,
  };
}

export function countryFlag(country: Country): string {
  const flags: Record<Country, string> = {
    germany: "🇩🇪",
    italy: "🇮🇹",
    spain: "🇪🇸",
    belgium: "🇧🇪",
    portugal: "🇵🇹",
  };
  return flags[country] ?? "🏳️";
}

export function openBadge(open: string): { label: string; className: string } {
  switch (open) {
    case "true":
      return { label: "Open", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
    case "false":
      return { label: "Closed", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
    default:
      return { label: "Unknown", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" };
  }
}

export function isStale(lastVerified: string | null, days = 14): boolean {
  if (!lastVerified) return true;
  const verified = new Date(lastVerified);
  const now = new Date();
  return (now.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24) > days;
}

export function effectiveDeadline(row: { application_deadline_non_eu: string | null; application_deadline: string | null }): string | null {
  return row.application_deadline_non_eu ?? row.application_deadline;
}
