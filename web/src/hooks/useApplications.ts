"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ApplicationStatus,
  ProgramRow,
  RejectionReason,
  UserApplication,
  UserOverride,
} from "@/lib/types";
import { intakeKey } from "@/lib/utils";

const STORAGE_KEY = "unis-applications";

export function useApplications(programs: ProgramRow[] = []) {
  const [applications, setApplications] = useState<Record<string, UserApplication>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load applications");
      }
      const data = await res.json();
      const map: Record<string, UserApplication> = {};
      for (const app of data.applications ?? []) {
        map[app.intake_key] = app;
      }
      setApplications(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || programs.length === 0) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const legacy = JSON.parse(raw) as Record<
        string,
        { status?: ApplicationStatus; notes?: string } & UserOverride
      >;
      const idToKey = new Map<number, string>();
      for (const p of programs) {
        idToKey.set(p.intake_id, intakeKey(p));
      }

      const toMigrate: UserApplication[] = [];
      for (const [idStr, ov] of Object.entries(legacy)) {
        const key = idToKey.get(Number(idStr));
        if (!key || applications[key]) continue;
        toMigrate.push({
          intake_key: key,
          status: ov.status ?? "todo",
          notes: ov.notes,
          overrides: {
            application_open: ov.application_open,
            application_deadline_non_eu: ov.application_deadline_non_eu,
            application_fee_eur: ov.application_fee_eur,
            tuition_amount: ov.tuition_amount,
          },
        });
      }

      if (toMigrate.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applications: toMigrate }),
      })
        .then(() => {
          localStorage.removeItem(STORAGE_KEY);
          load();
        })
        .catch(() => {});
    } catch {
      /* ignore corrupt legacy data */
    }
  }, [loading, programs, applications, load]);

  const persist = useCallback(async (app: UserApplication) => {
    setApplications((prev) => ({ ...prev, [app.intake_key]: app }));
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(app),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      const data = await res.json();
      setApplications((prev) => ({ ...prev, [app.intake_key]: data.application }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      load();
    }
  }, [load]);

  const getApp = useCallback(
    (program: ProgramRow): UserApplication => {
      const key = intakeKey(program);
      return (
        applications[key] ?? {
          intake_key: key,
          status: "todo",
        }
      );
    },
    [applications]
  );

  const getStatus = useCallback(
    (program: ProgramRow): ApplicationStatus => getApp(program).status,
    [getApp]
  );

  const isDone = useCallback(
    (program: ProgramRow) => getStatus(program) === "done",
    [getStatus]
  );

  const isRejected = useCallback(
    (program: ProgramRow) => getStatus(program) === "rejected",
    [getStatus]
  );

  const setStatus = useCallback(
    (program: ProgramRow, status: ApplicationStatus) => {
      const current = getApp(program);
      persist({
        ...current,
        status,
        rejection_reason: status === "rejected" ? current.rejection_reason : undefined,
        rejection_document: status === "rejected" ? current.rejection_document : undefined,
        rejection_note: status === "rejected" ? current.rejection_note : undefined,
      });
    },
    [getApp, persist]
  );

  const setNotes = useCallback(
    (program: ProgramRow, notes: string) => {
      persist({ ...getApp(program), notes });
    },
    [getApp, persist]
  );

  const setOverride = useCallback(
    (program: ProgramRow, patch: UserOverride) => {
      const current = getApp(program);
      persist({
        ...current,
        overrides: { ...current.overrides, ...patch },
      });
    },
    [getApp, persist]
  );

  const rejectProgram = useCallback(
    (
      program: ProgramRow,
      reason: RejectionReason,
      document?: string,
      note?: string
    ) => {
      persist({
        ...getApp(program),
        status: "rejected",
        rejection_reason: reason,
        rejection_document: document,
        rejection_note: note,
      });
    },
    [getApp, persist]
  );

  const restoreProgram = useCallback(
    (program: ProgramRow) => {
      persist({
        ...getApp(program),
        status: "todo",
        rejection_reason: undefined,
        rejection_document: undefined,
        rejection_note: undefined,
      });
    },
    [getApp, persist]
  );

  return {
    applications,
    loading,
    error,
    getApp,
    getStatus,
    isDone,
    isRejected,
    setStatus,
    setNotes,
    setOverride,
    rejectProgram,
    restoreProgram,
    reload: load,
  };
}
