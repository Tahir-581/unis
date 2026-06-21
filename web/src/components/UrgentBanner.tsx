"use client";

import type { UrgentProgram } from "@/lib/types";
import {
  countryFlag,
  formatDeadline,
  formatFee,
  formatTuition,
  intakeLabel,
} from "@/lib/utils";

interface Props {
  programs: UrgentProgram[];
}

export function UrgentBanner({ programs }: Props) {
  if (programs.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          No upcoming deadlines with dates found yet. Run the scraper enrichment or verify programs on official portals.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-5 dark:border-red-900/50 dark:from-red-950/40 dark:to-orange-950/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
          Apply first — earliest deadlines
        </h2>
      </div>
      <p className="mb-4 text-sm text-red-800/80 dark:text-red-300/80">
        These five programs have the nearest application deadlines. Prioritize them before others expire.
      </p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {programs.map((p) => {
          const tuition = formatTuition(
            p.tuition_non_eu_amount ?? p.tuition_amount,
            p.tuition_period,
            p.original_display_text
          );
          const deadline =
            p.application_deadline_non_eu ?? p.application_deadline;
          return (
            <div
              key={p.intake_id}
              className="rounded-lg border border-red-100 bg-white/80 p-3 shadow-sm dark:border-red-900/30 dark:bg-zinc-900/60"
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-500">
                <span>{countryFlag(p.country)}</span>
                <span className="truncate">{p.university_name}</span>
              </div>
              <p className="mb-2 line-clamp-2 text-sm font-medium leading-snug">
                {p.program_name}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {intakeLabel(p.intake_season, p.intake_year)}
              </p>
              <p className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400">
                {formatDeadline(deadline)}
                {p.days_remaining !== null && (
                  <span className="ml-1 font-normal text-red-600/70">
                    ({p.days_remaining}d left)
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span>App: {formatFee(p.application_fee_eur)}</span>
                <span>Tuition: {tuition.primary}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
