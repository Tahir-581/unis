"use client";

import {
  CATEGORY_LABELS,
  DOMAIN_CATEGORIES,
  DOMAIN_LABELS,
  FIELD_DOMAINS,
  type FieldDomain,
  type StudyCategory,
} from "@/lib/taxonomy";

export type SortOption = "deadline" | "tuition" | "app_fee" | "university";
export type FilterState = {
  universitySearch: string;
  programSearch: string;
  fieldDomain: FieldDomain | "all";
  studyCategory: StudyCategory | "all";
  openOnly: boolean;
  deadlineDays: number | null;
  freeTuition: boolean;
  noAppFee: boolean;
  hideDone: boolean;
  sort: SortOption;
};

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onExport: () => void;
  resultCount: number;
  hideProgramFilters?: boolean;
}

export function FiltersBar({ filters, onChange, onExport, resultCount, hideProgramFilters }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const categoryOptions =
    filters.fieldDomain === "all"
      ? []
      : DOMAIN_CATEGORIES[filters.fieldDomain];

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search university..."
          value={filters.universitySearch}
          onChange={(e) => set({ universitySearch: e.target.value })}
          className="min-w-[160px] flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <input
          type="search"
          placeholder="Search program..."
          value={filters.programSearch}
          onChange={(e) => set({ programSearch: e.target.value })}
          className="min-w-[160px] flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <select
          value={filters.fieldDomain}
          onChange={(e) =>
            set({
              fieldDomain: e.target.value as FieldDomain | "all",
              studyCategory: "all",
            })
          }
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {FIELD_DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        {categoryOptions.length > 0 && (
          <select
            value={filters.studyCategory}
            onChange={(e) =>
              set({ studyCategory: e.target.value as StudyCategory | "all" })
            }
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="all">All sub-fields</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        )}
        <select
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value as SortOption })}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="deadline">Sort: Deadline</option>
          <option value="tuition">Sort: Tuition</option>
          <option value="app_fee">Sort: Application fee</option>
          <option value="university">Sort: University</option>
        </select>
        <button
          onClick={onExport}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Export CSV
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {!hideProgramFilters && (
          <>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.openOnly}
                onChange={(e) => set({ openOnly: e.target.checked })}
              />
              Open only
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hideDone}
                onChange={(e) => set({ hideDone: e.target.checked })}
              />
              Hide completed
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.freeTuition}
                onChange={(e) => set({ freeTuition: e.target.checked })}
              />
              Free tuition
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.noAppFee}
                onChange={(e) => set({ noAppFee: e.target.checked })}
              />
              No application fee
            </label>
            <label className="flex items-center gap-2">
              Deadline within
              <select
                value={filters.deadlineDays ?? ""}
                onChange={(e) =>
                  set({ deadlineDays: e.target.value ? Number(e.target.value) : null })
                }
                className="rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700"
              >
                <option value="">Any</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </label>
          </>
        )}
      </div>
      <p className="text-xs text-zinc-500">{resultCount} program intakes shown</p>
    </div>
  );
}

export function domainBadgeClass(domain: string | null | undefined): string {
  switch (domain) {
    case "engineering":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
    case "mathematics":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  }
}

export { DOMAIN_LABELS, CATEGORY_LABELS };
