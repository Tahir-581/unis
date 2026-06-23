"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CountrySelector } from "@/components/CountrySelector";
import { FiltersBar, type FilterState } from "@/components/FiltersBar";
import { ProgramCard } from "@/components/ProgramCard";
import { UrgentBanner } from "@/components/UrgentBanner";
import { ViewToggle, type DashboardView } from "@/components/ViewToggle";
import { useApplications } from "@/hooks/useApplications";
import type { Country, CountryStats, ProgramRow, UrgentProgram } from "@/lib/types";
import { REJECTION_LABELS } from "@/components/RejectModal";
import { daysUntil, effectiveDeadline } from "@/lib/utils";

const DEFAULT_FILTERS: FilterState = {
  universitySearch: "",
  programSearch: "",
  fieldDomain: "all",
  studyCategory: "all",
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
  const [view, setView] = useState<DashboardView>("programs");
  const [loading, setLoading] = useState(true);
  const [lastScrape, setLastScrape] = useState<string | null>(null);

  const {
    loading: appsLoading,
    error: appsError,
    getApp,
    getStatus,
    isDone,
    isRejected,
    setStatus,
    setNotes,
    setOverride,
    rejectProgram,
    restoreProgram,
  } = useApplications(programs);

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

  const rejectedCount = useMemo(
    () => programs.filter((p) => isRejected(p)).length,
    [programs, isRejected]
  );

  const filtered = useMemo(() => {
    let rows = programs.filter((p) => {
      const app = getApp(p);
      const ov = app.overrides;
      const rejected = app.status === "rejected";

      if (view === "rejected") {
        if (!rejected) return false;
      } else if (rejected) {
        return false;
      }

      const deadline = ov?.application_deadline_non_eu ?? effectiveDeadline(p);
      const appOpen = ov?.application_open ?? p.application_open;
      const tuition = ov?.tuition_amount ?? p.tuition_non_eu_amount ?? p.tuition_amount;
      const appFee = ov?.application_fee_eur ?? p.application_fee_eur;

      if (view === "programs" && filters.hideDone && isDone(p)) return false;
      if (view === "programs" && filters.openOnly && appOpen !== "true") return false;
      if (view === "programs" && filters.freeTuition && tuition !== 0) return false;
      if (view === "programs" && filters.noAppFee && appFee !== 0 && appFee !== null) return false;
      if (view === "programs" && filters.deadlineDays !== null) {
        const d = daysUntil(deadline);
        if (d === null || d < 0 || d > filters.deadlineDays) return false;
      }
      if (filters.universitySearch) {
        const q = filters.universitySearch.toLowerCase();
        const hay = `${p.university_name} ${p.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.programSearch) {
        const q = filters.programSearch.toLowerCase();
        if (!p.program_name.toLowerCase().includes(q)) return false;
      }
      if (filters.fieldDomain !== "all") {
        const domain = p.field_domain ?? "computer_science";
        if (domain !== filters.fieldDomain) return false;
      }
      if (filters.studyCategory !== "all") {
        const category = p.study_category ?? p.cs_category;
        if (category !== filters.studyCategory) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const ovA = getApp(a).overrides;
      const ovB = getApp(b).overrides;
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
  }, [programs, filters, view, getApp, isDone]);

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
      "Rejection Reason",
      "Rejection Document",
      "Notes",
      "URL",
    ];
    const lines = filtered.map((p) => {
      const app = getApp(p);
      const ov = app.overrides;
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
        getStatus(p),
        app.rejection_reason ? REJECTION_LABELS[app.rejection_reason] : "",
        app.rejection_document ?? "",
        app.notes ?? "",
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
    a.download = `stem-masters-${country}-${view}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageLoading = loading || appsLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          EU STEM Master&apos;s Application Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          English-taught CS, engineering &amp; mathematics programs · Non-EU applicant · Winter 2026/27, Summer 2027, Winter 2027/28
        </p>
        {lastScrape && (
          <p className="mt-1 text-xs text-zinc-400">
            Last data refresh: {new Date(lastScrape).toLocaleString("en-GB")} — verify critical fields on official portals
          </p>
        )}
        {appsError && (
          <p className="mt-1 text-xs text-red-500">
            Application sync error: {appsError}
          </p>
        )}
      </header>

      {view === "programs" && (
        <UrgentBanner programs={urgent.filter((p) => !isDone(p) && !isRejected(p))} />
      )}

      <CountrySelector
        selected={country}
        onSelect={(c) => {
          setCountry(c);
          setFilters((f) => ({
            ...f,
            universitySearch: "",
            programSearch: "",
            fieldDomain: "all",
            studyCategory: "all",
          }));
        }}
        stats={stats}
      />

      <ViewToggle view={view} rejectedCount={rejectedCount} onChange={setView} />

      <FiltersBar
        filters={filters}
        onChange={setFilters}
        onExport={exportCsv}
        resultCount={filtered.length}
        hideProgramFilters={view === "rejected"}
      />

      {pageLoading ? (
        <p className="py-12 text-center text-zinc-500">Loading programs...</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">
          {view === "rejected"
            ? "No rejected applications for this country."
            : "No programs match your filters."}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProgramCard
              key={p.intake_id}
              program={p}
              application={getApp(p)}
              view={view}
              onToggleDone={(done) => setStatus(p, done ? "done" : "todo")}
              onNotesChange={(notes) => setNotes(p, notes)}
              onOverride={(patch) => setOverride(p, patch)}
              onReject={(reason, document, note) =>
                rejectProgram(p, reason, document, note)
              }
              onRestore={() => restoreProgram(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
