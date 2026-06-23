"use client";

export type DashboardView = "programs" | "rejected";

interface Props {
  view: DashboardView;
  rejectedCount: number;
  onChange: (view: DashboardView) => void;
}

export function ViewToggle({ view, rejectedCount, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
      <button
        onClick={() => onChange("programs")}
        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
          view === "programs"
            ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        Programs
      </button>
      <button
        onClick={() => onChange("rejected")}
        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
          view === "rejected"
            ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        Rejected{rejectedCount > 0 ? ` (${rejectedCount})` : ""}
      </button>
    </div>
  );
}
