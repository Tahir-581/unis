import { get, put } from "@vercel/blob";
import type { ApplicationStatus, RejectionReason, UserApplication, UserOverride } from "./types";

const BLOB_PATH = "user-applications/data.json";

interface StoreData {
  applications: Record<string, UserApplication>;
}

function blobOptions() {
  return {
    access: "private" as const,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  };
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function readStore(): Promise<StoreData> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const result = await get(BLOB_PATH, blobOptions());
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { applications: {} };
  }

  const text = await streamToText(result.stream);
  return JSON.parse(text) as StoreData;
}

async function writeStore(data: StoreData): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  await put(BLOB_PATH, JSON.stringify(data), {
    ...blobOptions(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function ensureSchema(): Promise<void> {
  await readStore();
}

export async function getAllApplications(country?: string): Promise<UserApplication[]> {
  const store = await readStore();
  const apps = Object.values(store.applications);
  if (!country) return apps;
  return apps.filter((a) => a.intake_key.startsWith(`${country}|`));
}

export async function upsertApplication(app: UserApplication): Promise<UserApplication> {
  const store = await readStore();
  const existing = store.applications[app.intake_key];
  const merged: UserApplication = {
    ...existing,
    ...app,
    overrides: { ...existing?.overrides, ...app.overrides } as UserOverride | undefined,
  };
  store.applications[app.intake_key] = merged;
  await writeStore(store);
  return merged;
}

export async function bulkUpsertApplications(apps: UserApplication[]): Promise<number> {
  const store = await readStore();
  for (const app of apps) {
    const existing = store.applications[app.intake_key];
    store.applications[app.intake_key] = {
      ...existing,
      ...app,
      overrides: { ...existing?.overrides, ...app.overrides },
    };
  }
  await writeStore(store);
  return apps.length;
}
