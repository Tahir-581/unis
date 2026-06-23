import Database from "better-sqlite3";
import DB_PATH from "./db-path";
import type { Country, CountryStats, ProgramRow, UrgentProgram } from "./types";

const PROGRAMS_QUERY = `
  SELECT
    pi.id AS intake_id,
    p.id AS program_id,
    u.name AS university_name,
    u.city,
    u.country,
    COALESCE(p.english_name, p.official_name) AS program_name,
    p.external_id,
    p.field_domain,
    p.study_category,
    p.cs_category,
    p.source_url,
    pi.intake_season,
    pi.intake_year,
    pi.application_open,
    pi.application_deadline,
    pi.application_deadline_non_eu,
    pi.admission_url,
    pi.confidence,
    pi.last_verified_at,
    pf.application_fee_eur,
    pf.application_fee_notes,
    pf.tuition_amount,
    pf.tuition_period,
    pf.tuition_non_eu_amount,
    pf.tuition_notes,
    pf.original_display_text,
    p.ects,
    p.duration_months
  FROM program_intakes pi
  JOIN programs p ON p.id = pi.program_id
  JOIN universities u ON u.id = p.university_id
  LEFT JOIN program_fees pf ON pf.program_id = p.id
`;

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}

export function getAllPrograms(country?: Country): ProgramRow[] {
  const conn = getDb();
  if (country) {
    return conn.prepare(`${PROGRAMS_QUERY} WHERE u.country = ? ORDER BY u.name, p.official_name, pi.intake_year`).all(country) as ProgramRow[];
  }
  return conn.prepare(`${PROGRAMS_QUERY} ORDER BY u.country, u.name, p.official_name, pi.intake_year`).all() as ProgramRow[];
}

export function getCountryStats(): CountryStats[] {
  const conn = getDb();
  const rows = conn
    .prepare(
      `
    SELECT
      u.country,
      COUNT(pi.id) AS intake_count,
      SUM(CASE
        WHEN pi.application_deadline_non_eu IS NOT NULL
          AND date(pi.application_deadline_non_eu) BETWEEN date('now') AND date('now', '+30 days')
        THEN 1 ELSE 0
      END) AS deadlines_30_days
    FROM programs p
    JOIN universities u ON u.id = p.university_id
    JOIN program_intakes pi ON pi.program_id = p.id
    GROUP BY u.country
  `
    )
    .all() as CountryStats[];
  return rows;
}

export function getUrgentPrograms(limit = 5): UrgentProgram[] {
  const conn = getDb();
  const rows = conn
    .prepare(
      `
    SELECT *,
      CAST(julianday(deadline) - julianday('now') AS INTEGER) AS days_remaining
    FROM (
      SELECT
        pi.id AS intake_id,
        p.id AS program_id,
        u.name AS university_name,
        u.city,
        u.country,
        COALESCE(p.english_name, p.official_name) AS program_name,
        p.field_domain,
        p.study_category,
        p.cs_category,
        p.source_url,
        pi.intake_season,
        pi.intake_year,
        pi.application_open,
        pi.application_deadline,
        pi.application_deadline_non_eu,
        pi.admission_url,
        pi.confidence,
        pi.last_verified_at,
        pf.application_fee_eur,
        pf.application_fee_notes,
        pf.tuition_amount,
        pf.tuition_period,
        pf.tuition_non_eu_amount,
        pf.tuition_notes,
        pf.original_display_text,
        p.ects,
        p.duration_months,
        COALESCE(pi.application_deadline_non_eu, pi.application_deadline) AS deadline
      FROM program_intakes pi
      JOIN programs p ON p.id = pi.program_id
      JOIN universities u ON u.id = p.university_id
      LEFT JOIN program_fees pf ON pf.program_id = p.id
      WHERE COALESCE(pi.application_deadline_non_eu, pi.application_deadline) IS NOT NULL
        AND date(COALESCE(pi.application_deadline_non_eu, pi.application_deadline)) >= date('now')
        AND pi.application_open != 'false'
    )
    ORDER BY deadline ASC
    LIMIT ?
  `
    )
    .all(limit) as UrgentProgram[];
  return rows;
}

export function getLastScrapeRun() {
  const conn = getDb();
  return conn
    .prepare("SELECT * FROM scrape_runs ORDER BY finished_at DESC LIMIT 1")
    .get();
}
