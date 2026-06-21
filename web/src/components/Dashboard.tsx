"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CountrySelector } from "@/components/CountrySelector";
import { FiltersBar, type FilterState } from "@/components/FiltersBar";
import { ProgramCard } from "@/components/ProgramCard";
import { UrgentBanner } from "@/components/UrgentBanner";
import { useApplications } from "@/hooks/useApplications";
import type { Country, CountryStats, ProgramRow, UrgentProgram } from "@/lib/types";
import { daysUntil, effectiveDeadline } from "@/lib/utils";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  openOnly: false,
  deadlineDays: null,
  freeTuition: false,
  noAppFee: false,
  hideDone: false,
  sort: "deadline",
};

export function Dashboard() {
  const [country, setCountry] = useState<Country>("germany");
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [stats, setStats] = useState<CountryStats[]>([]);
  const [urgent, setUrgent] = useState<UrgentProgram[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [lastScrape, setLastScrape] = useState<string | null>(null);
  const { overrides, setStatus, setNotes, setOverride, getStatus, isDone } =
    useApplications();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, urgentRes, statusRes] = await Promise.all([
        fetch(`/api/programs?country=${country}`),
        fetch("/api/urgent"),
        fetch("/api/scrape-status"),
      ]);
      const progData = await progRes.json();
      const urgentData = await urgentRes.json();
      const statusData = await statusRes.json();
      setPrograms(progData.programs ?? []);
      setStats(progData.stats ?? []);
      setUrgent(urgentData.urgent ?? []);
      if (statusData.lastRun?.finished_at) {
        setLastScrape(statusData.lastRun.finished_at);
      }
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let rows = programs.filter((p) => {
      const ov = overrides[p.intake_id];
      const deadline = ov?.application_deadline_non_eu ?? effectiveDeadline(p);
      const appOpen = ov?.application_open ?? p.application_open;
      const tuition = ov?.tuition_amount ?? p.tuition_non_eu_amount ?? p.tuition_amount;
      const appFee = ov?.application_fee_eur ?? p.application_fee_eur;

      if (filters.hideDone && isDone(p.intake_id)) return false;
      if (filters.openOnly && appOpen !== "true") return false;
      if (filters.freeTuition && tuition !== 0) return false;
      if (filters.noAppFee && appFee !== 0 && appFee !== null) return false;
      if (filters.deadlineDays !== null) {
        const d = daysUntil(deadline);
        if (d === null || d < 0 || d > filters.deadlineDays) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${p.university_name} ${p.program_name} ${p.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const ovA = overrides[a.intake_id];
      const ovB = overrides[b.intake_id];
      switch (filters.sort) {
        case "deadline": {
          const dA = ovA?.application_deadline_non_eu ?? effectiveDeadline(a) ?? "9999";
          const dB = ovB?.application_deadline_non_eu ?? effectiveDeadline(b) ?? "9999";
          return dA.localeCompare(dB);
        }
        case "tuition": {
          const tA = ovA?.tuition_amount ?? a.tuition_non_eu_amount ?? a.tuition_amount ?? 99999;
          const tB = ovB?.tuition_amount ?? b.tuition_non_eu_amount ?? b.tuition_amount ?? 99999;
          return tA - tB;
        }
        case "app_fee": {
          const fA = ovA?.application_fee_eur ?? a.application_fee_eur ?? 99999;
          const fB = ovB?.application_fee_eur ?? b.application_fee_eur ?? 99999;
          return fA - fB;
        }
        case "university":
          return a.university_name.localeCompare(b.university_name);
        default:
          return 0;
      }
    });

    return rows;
  }, [programs, filters, overrides, isDone]);

  const exportCsv = () => {
    const headers = [
      "Country",
      "University",
      "City",
      "Program",
      "Intake",
      "Open",
      "Deadline",
      "App Fee EUR",
      "Tuition",
      "Status",
      "Notes",
      "URL",
    ];
    const lines = filtered.map((p) => {
      const ov = overrides[p.intake_id];
      const deadline = ov?.application_deadline_non_eu ?? effectiveDeadline(p) ?? "";
      return [
        p.country,
        p.university_name,
        p.city ?? "",
        p.program_name,
        `${p.intake_season} ${p.intake_year}`,
        ov?.application_open ?? p.application_open,
        deadline,
        ov?.application_fee_eur ?? p.application_fee_eur ?? "",
        p.original_display_text ?? p.tuition_amount ?? "",
        getStatus(p.intake_id),
        ov?.notes ?? "",
        p.admission_url ?? p.source_url ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cs-masters-${country}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          EU CS Master&apos;s Application Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          English-taught computer science programs · Non-EU applicant · Winter 2026/27, Summer 2027, Winter 2027/28
        </p>
        {lastScrape && (
          <p className="mt-1 text-xs text-zinc-400">
            Last data refresh: {new Date(lastScrape).toLocaleString("en-GB")} — verify critical fields on official portals
          </p>
        )}
      </header>

      <UrgentBanner programs={urgent.filter((p) => !isDone(p.intake_id))} />

      <CountrySelector selected={country} onSelect={setCountry} stats={stats} />

      <FiltersBar
        filters={filters}
        onChange={setFilters}
        onExport={exportCsv}
        resultCount={filtered.length}
      />

      {loading ? (
        <p className="py-12 text-center text-zinc-500">Loading programs...</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No programs match your filters.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProgramCard
              key={p.intake_id}
              program={p}
              status={getStatus(p.intake_id)}
              override={overrides[p.intake_id]}
              onToggleDone={(done) =>
                setStatus(p.intake_id, done ? "done" : "todo")
              }
              onNotesChange={(notes) => setNotes(p.intake_id, notes)}
              onOverride={(patch) => setOverride(p.intake_id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
