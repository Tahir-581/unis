"use client";

import type { Country, CountryStats } from "@/lib/types";
import { COUNTRIES } from "@/lib/types";

interface Props {
  selected: Country;
  onSelect: (c: Country) => void;
  stats: CountryStats[];
}

export function CountrySelector({ selected, onSelect, stats }: Props) {
  const statsMap = Object.fromEntries(stats.map((s) => [s.country, s]));

  return (
    <div className="flex flex-wrap gap-2">
      {COUNTRIES.map((c) => {
        const s = statsMap[c.id];
        const active = selected === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`rounded-lg border px-4 py-2.5 text-left transition ${
              active
                ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-950/40"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{c.flag}</span>
              <span className="font-medium">{c.label}</span>
            </div>
            {s && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {s.intake_count} intakes · {s.deadlines_30_days} deadlines in 30 days
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
