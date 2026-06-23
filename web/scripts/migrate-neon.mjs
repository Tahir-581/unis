#!/usr/bin/env node
/** Run Neon schema migration when DATABASE_URL is set. */
import { neon } from "@neondatabase/serverless";
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS user_applications (
    intake_key TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'todo',
    rejection_reason TEXT,
    rejection_document TEXT,
    rejection_note TEXT,
    notes TEXT,
    overrides JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
console.log("Migration applied: user_applications");
