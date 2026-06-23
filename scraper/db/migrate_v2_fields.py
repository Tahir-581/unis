#!/usr/bin/env python3
"""Migrate programs table from cs_category-only to field_domain + study_category."""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.filters import classify_program
from db.database import DB_PATH, init_db


def migrate(db_path: Path | None = None) -> None:
    path = db_path or DB_PATH
    init_db(path)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row

    cols = {row[1] for row in conn.execute("PRAGMA table_info(programs)").fetchall()}

    if "field_domain" not in cols:
        conn.execute(
            "ALTER TABLE programs ADD COLUMN field_domain TEXT DEFAULT 'computer_science'"
        )
    if "study_category" not in cols:
        conn.execute(
            "ALTER TABLE programs ADD COLUMN study_category TEXT DEFAULT 'informatics'"
        )

    rows = conn.execute(
        "SELECT id, official_name, english_name, cs_category, field_domain, study_category FROM programs"
    ).fetchall()

    for row in rows:
        name = row["english_name"] or row["official_name"]
        if row["field_domain"] and row["study_category"] and row["field_domain"] != "computer_science":
            continue
        if row["study_category"] and row["study_category"] != "informatics" and row["field_domain"]:
            continue

        domain, category = classify_program(name)
        legacy_cs = row["cs_category"] or category
        if row["cs_category"] and row["field_domain"] == "computer_science":
            domain = "computer_science"
            category = row["cs_category"]

        conn.execute(
            """
            UPDATE programs
            SET field_domain = ?, study_category = ?, cs_category = COALESCE(cs_category, ?)
            WHERE id = ?
            """,
            (domain, category, legacy_cs, row["id"]),
        )

    conn.commit()
    conn.close()
    print(f"Migrated {len(rows)} programs in {path}")


if __name__ == "__main__":
    migrate()
