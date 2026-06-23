"use client";

import { useState } from "react";
import type { RejectionReason } from "@/lib/types";

const REASONS: { id: RejectionReason; label: string }[] = [
  { id: "application_fees", label: "Application fees" },
  { id: "deadline_passed", label: "Deadline passed" },
  { id: "document", label: "Document" },
  { id: "other", label: "Other" },
];

interface Props {
  programName: string;
  onConfirm: (reason: RejectionReason, document?: string, note?: string) => void;
  onCancel: () => void;
}

export function RejectModal({ programName, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState<RejectionReason>("application_fees");
  const [document, setDocument] = useState("");
  const [note, setNote] = useState("");

  const canConfirm = reason !== "document" || document.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2 id="reject-title" className="text-lg font-semibold">
          Reject application
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Why are you rejecting <span className="font-medium text-zinc-700 dark:text-zinc-300">{programName}</span>?
        </p>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              <input
                type="radio"
                name="rejection-reason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="h-4 w-4"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        {reason === "document" && (
          <input
            type="text"
            placeholder="Which document? (required)"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            autoFocus
          />
        )}

        {reason === "other" && (
          <input
            type="text"
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm(
                reason,
                reason === "document" ? document.trim() : undefined,
                reason === "other" ? note.trim() || undefined : undefined
              )
            }
            disabled={!canConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm rejection
          </button>
        </div>
      </div>
    </div>
  );
}

export const REJECTION_LABELS: Record<RejectionReason, string> = {
  application_fees: "Application fees",
  deadline_passed: "Deadline passed",
  document: "Document",
  other: "Other",
};
