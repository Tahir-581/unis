"""Normalize text deadlines to ISO dates for sorting and urgent banner."""

from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db.database import get_connection

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}


def parse_text_deadline(text: str, intake_season: str, intake_year: int) -> str | None:
    if not text:
        return None
    if re.match(r"\d{4}-\d{2}-\d{2}", text):
        return text[:10]

    # Skip unparseable fragments
    if len(text) < 5 or not re.search(r"\d", text):
        return None

    m = re.search(r"(\d{1,2})\s+([A-Za-z]{3,})(?:\s+(\d{4}))?", text)
    if not m:
        m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", text)
        if m:
            return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"

    if m:
        day = int(m.group(1))
        month = MONTHS.get(m.group(2).lower())
        year = int(m.group(3)) if m.group(3) else None
        if not month:
            return None
        if not year:
            if intake_season == "winter":
                year = intake_year if month >= 7 else intake_year
            else:
                year = intake_year if month <= 6 else intake_year - 1
        try:
            datetime(year, month, day)
        except ValueError:
            return None
        return f"{year}-{month:02d}-{day:02d}"
    return None


def normalize_all() -> int:
    updated = 0
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, application_deadline_non_eu, application_deadline, intake_season, intake_year
            FROM program_intakes
            """
        ).fetchall()
        for row in rows:
            raw = row["application_deadline_non_eu"] or row["application_deadline"]
            if not raw or re.match(r"\d{4}-\d{2}-\d{2}", raw):
                continue
            iso = parse_text_deadline(raw, row["intake_season"], row["intake_year"])
            if iso:
                conn.execute(
                    "UPDATE program_intakes SET application_deadline_non_eu = ? WHERE id = ?",
                    (iso, row["id"]),
                )
                updated += 1
            elif not re.match(r"\d{4}-\d{2}-\d{2}", raw):
                # Clear invalid text deadlines that can't be parsed
                conn.execute(
                    "UPDATE program_intakes SET application_deadline_non_eu = NULL WHERE id = ?",
                    (row["id"],),
                )
    return updated


if __name__ == "__main__":
    n = normalize_all()
    print(f"Normalized {n} deadlines")
