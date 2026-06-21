"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApplicationStatus, UserOverride } from "@/lib/types";

const STORAGE_KEY = "unis-applications";

export function useApplications() {
  const [overrides, setOverrides] = useState<Record<number, UserOverride>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback((next: Record<number, UserOverride>) => {
    setOverrides(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setStatus = useCallback(
    (intakeId: number, status: ApplicationStatus) => {
      save({ ...overrides, [intakeId]: { ...overrides[intakeId], status } });
    },
    [overrides, save]
  );

  const setNotes = useCallback(
    (intakeId: number, notes: string) => {
      save({ ...overrides, [intakeId]: { ...overrides[intakeId], notes } });
    },
    [overrides, save]
  );

  const setOverride = useCallback(
    (intakeId: number, patch: UserOverride) => {
      save({ ...overrides, [intakeId]: { ...overrides[intakeId], ...patch } });
    },
    [overrides, save]
  );

  const getStatus = (intakeId: number): ApplicationStatus =>
    overrides[intakeId]?.status ?? "todo";

  const isDone = (intakeId: number) => getStatus(intakeId) === "done";

  return { overrides, setStatus, setNotes, setOverride, getStatus, isDone };
}
