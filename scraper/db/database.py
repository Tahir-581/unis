"""SQLite database helpers for the scraper pipeline."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "data" / "unis.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def init_db(db_path: Path | None = None) -> Path:
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(SCHEMA_PATH.read_text())
        conn.commit()
    return path


@contextmanager
def get_connection(db_path: Path | None = None):
    path = db_path or DB_PATH
    init_db(path)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def upsert_university(conn: sqlite3.Connection, *, name: str, country: str, city: str | None = None, website: str | None = None) -> int:
    conn.execute(
        """
        INSERT INTO universities (name, country, city, website)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(name, country, city) DO UPDATE SET
            website = COALESCE(excluded.website, universities.website)
        """,
        (name, country, city, website),
    )
    row = conn.execute(
        "SELECT id FROM universities WHERE name = ? AND country = ? AND (city IS ? OR city = ?)",
        (name, country, city, city),
    ).fetchone()
    return row["id"]


def upsert_program(
    conn: sqlite3.Connection,
    *,
    university_id: int,
    official_name: str,
    english_name: str | None = None,
    ects: int | None = None,
    duration_months: int | None = None,
    language: str = "english",
    cs_category: str = "informatics",
    source_url: str | None = None,
    catalog_confidence: str = "medium",
    external_id: str | None = None,
) -> int:
    conn.execute(
        """
        INSERT INTO programs (
            university_id, official_name, english_name, ects, duration_months,
            language, cs_category, source_url, catalog_confidence, external_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(university_id, official_name) DO UPDATE SET
            english_name = COALESCE(excluded.english_name, programs.english_name),
            ects = COALESCE(excluded.ects, programs.ects),
            duration_months = COALESCE(excluded.duration_months, programs.duration_months),
            language = excluded.language,
            cs_category = excluded.cs_category,
            source_url = COALESCE(excluded.source_url, programs.source_url),
            catalog_confidence = excluded.catalog_confidence,
            external_id = COALESCE(excluded.external_id, programs.external_id)
        """,
        (
            university_id,
            official_name,
            english_name,
            ects,
            duration_months,
            language,
            cs_category,
            source_url,
            catalog_confidence,
            external_id,
        ),
    )
    row = conn.execute(
        "SELECT id FROM programs WHERE university_id = ? AND official_name = ?",
        (university_id, official_name),
    ).fetchone()
    return row["id"]


def upsert_intake(
    conn: sqlite3.Connection,
    *,
    program_id: int,
    intake_season: str,
    intake_year: int,
    application_open: str = "unknown",
    application_deadline: str | None = None,
    application_deadline_non_eu: str | None = None,
    classes_start: str | None = None,
    admission_url: str | None = None,
    confidence: str = "low",
) -> int:
    now = conn.execute("SELECT datetime('now')").fetchone()[0]
    conn.execute(
        """
        INSERT INTO program_intakes (
            program_id, intake_season, intake_year, application_open,
            application_deadline, application_deadline_non_eu, classes_start,
            admission_url, last_verified_at, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(program_id, intake_season, intake_year) DO UPDATE SET
            application_open = excluded.application_open,
            application_deadline = COALESCE(excluded.application_deadline, program_intakes.application_deadline),
            application_deadline_non_eu = COALESCE(excluded.application_deadline_non_eu, program_intakes.application_deadline_non_eu),
            classes_start = COALESCE(excluded.classes_start, program_intakes.classes_start),
            admission_url = COALESCE(excluded.admission_url, program_intakes.admission_url),
            last_verified_at = excluded.last_verified_at,
            confidence = excluded.confidence
        """,
        (
            program_id,
            intake_season,
            intake_year,
            application_open,
            application_deadline,
            application_deadline_non_eu,
            classes_start,
            admission_url,
            now,
            confidence,
        ),
    )
    row = conn.execute(
        "SELECT id FROM program_intakes WHERE program_id = ? AND intake_season = ? AND intake_year = ?",
        (program_id, intake_season, intake_year),
    ).fetchone()
    return row["id"]


def upsert_fees(
    conn: sqlite3.Connection,
    *,
    program_id: int,
    application_fee_eur: float | None = None,
    application_fee_notes: str | None = None,
    tuition_amount: float | None = None,
    tuition_period: str = "unknown",
    tuition_non_eu_amount: float | None = None,
    tuition_notes: str | None = None,
    original_display_text: str | None = None,
    confidence: str = "low",
) -> None:
    now = conn.execute("SELECT datetime('now')").fetchone()[0]
    conn.execute(
        """
        INSERT INTO program_fees (
            program_id, application_fee_eur, application_fee_notes,
            tuition_amount, tuition_period, tuition_non_eu_amount,
            tuition_notes, original_display_text, last_verified_at, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(program_id) DO UPDATE SET
            application_fee_eur = COALESCE(excluded.application_fee_eur, program_fees.application_fee_eur),
            application_fee_notes = COALESCE(excluded.application_fee_notes, program_fees.application_fee_notes),
            tuition_amount = COALESCE(excluded.tuition_amount, program_fees.tuition_amount),
            tuition_period = excluded.tuition_period,
            tuition_non_eu_amount = COALESCE(excluded.tuition_non_eu_amount, program_fees.tuition_non_eu_amount),
            tuition_notes = COALESCE(excluded.tuition_notes, program_fees.tuition_notes),
            original_display_text = COALESCE(excluded.original_display_text, program_fees.original_display_text),
            last_verified_at = excluded.last_verified_at,
            confidence = excluded.confidence
        """,
        (
            program_id,
            application_fee_eur,
            application_fee_notes,
            tuition_amount,
            tuition_period,
            tuition_non_eu_amount,
            tuition_notes,
            original_display_text,
            now,
            confidence,
        ),
    )


def log_scrape_run(
    conn: sqlite3.Connection,
    *,
    country: str,
    collector: str,
    status: str,
    programs_found: int = 0,
    programs_enriched: int = 0,
    error_message: str | None = None,
) -> None:
    conn.execute(
        """
        INSERT INTO scrape_runs (country, collector, status, programs_found, programs_enriched, error_message, finished_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """,
        (country, collector, status, programs_found, programs_enriched, error_message),
    )
