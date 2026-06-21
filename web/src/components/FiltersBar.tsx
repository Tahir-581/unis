"use client";

export type SortOption = "deadline" | "tuition" | "app_fee" | "university";
export type FilterState = {
  search: string;
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
}

export function FiltersBar({ filters, onChange, onExport, resultCount }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search university or program..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
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
      </div>
      <p className="text-xs text-zinc-500">{resultCount} program intakes shown</p>
    </div>
  );
}
