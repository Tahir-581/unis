"use client";

import { useState } from "react";
import type { ProgramRow, UserOverride } from "@/lib/types";
import {
  countryFlag,
  daysUntil,
  effectiveDeadline,
  formatDeadline,
  formatFee,
  formatTuition,
  intakeLabel,
  isStale,
  openBadge,
} from "@/lib/utils";

interface Props {
  program: ProgramRow;
  status: string;
  override?: UserOverride;
  onToggleDone: (done: boolean) => void;
  onNotesChange: (notes: string) => void;
  onOverride: (patch: UserOverride) => void;
}

export function ProgramCard({
  program,
  status,
  override,
  onToggleDone,
  onNotesChange,
  onOverride,
}: Props) {
  const [editing, setEditing] = useState(false);
  const done = status === "done";

  const deadline =
    override?.application_deadline_non_eu ??
    effectiveDeadline(program);
  const appOpen = override?.application_open ?? program.application_open;
  const appFee = override?.application_fee_eur ?? program.application_fee_eur;
  const tuitionAmt =
    override?.tuition_amount ??
    program.tuition_non_eu_amount ??
    program.tuition_amount;
  const tuition = formatTuition(
    tuitionAmt,
    program.tuition_period,
    program.original_display_text
  );
  const badge = openBadge(appOpen);
  const days = daysUntil(deadline);
  const stale = isStale(program.last_verified_at);
  const verifyUrl = program.admission_url ?? program.source_url;

  return (
    <article
      className={`rounded-xl border p-4 transition ${
        done
          ? "border-emerald-200 bg-emerald-50/50 opacity-75 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span>{countryFlag(program.country)}</span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {program.university_name}
              {program.city && ` · ${program.city}`}
            </span>
            {stale && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Stale data
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold leading-snug">{program.program_name}</h3>
          {program.cs_category && (
            <p className="mt-0.5 text-xs capitalize text-zinc-500">
              {program.cs_category.replace("_", " ")}
              {program.ects && ` · ${program.ects} ECTS`}
            </p>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => onToggleDone(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-medium">{done ? "Done" : "Mark done"}</span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Intake" value={intakeLabel(program.intake_season, program.intake_year)} />
        <Field label="Status">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </Field>
        <Field
          label="Deadline (non-EU)"
          value={
            deadline ? (
              <>
                {formatDeadline(deadline)}
                {days !== null && days >= 0 && (
                  <span className="ml-1 text-zinc-500">({days}d)</span>
                )}
              </>
            ) : (
              "Not listed"
            )
          }
        />
        <Field label="Application fee" value={formatFee(appFee)} sub={program.application_fee_notes} />
        <Field label="Tuition (non-EU)" value={tuition.primary} sub={tuition.secondary ?? program.tuition_notes} />
        <Field
          label="Confidence"
          value={
            <span className="capitalize">{program.confidence}</span>
          }
        />
        <Field
          label="Last verified"
          value={
            program.last_verified_at
              ? new Date(program.last_verified_at).toLocaleDateString("en-GB")
              : "Never"
          }
        />
        <Field label="Application status" value={status.replace("_", " ")} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {verifyUrl && (
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Verify on portal →
          </a>
        )}
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {editing ? "Close override" : "Manual override"}
        </button>
      </div>

      <div className="mt-3">
        <input
          type="text"
          placeholder="Notes (e.g. paid €30, waiting for transcript)"
          value={override?.notes ?? ""}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      {editing && (
        <div className="mt-3 grid gap-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600">
          <p className="text-xs text-zinc-500">Override fields you verified manually:</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={override?.application_open ?? program.application_open}
              onChange={(e) =>
                onOverride({
                  application_open: e.target.value as "true" | "false" | "unknown",
                })
              }
              className="rounded border px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="true">Open</option>
              <option value="false">Closed</option>
              <option value="unknown">Unknown</option>
            </select>
            <input
              type="date"
              value={override?.application_deadline_non_eu?.slice(0, 10) ?? deadline?.slice(0, 10) ?? ""}
              onChange={(e) =>
                onOverride({ application_deadline_non_eu: e.target.value })
              }
              className="rounded border px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              type="number"
              placeholder="App fee €"
              value={override?.application_fee_eur ?? appFee ?? ""}
              onChange={(e) =>
                onOverride({ application_fee_eur: Number(e.target.value) })
              }
              className="rounded border px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  sub?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="text-sm font-medium">{children ?? value}</div>
      {sub && <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{sub}</p>}
    </div>
  );
}
