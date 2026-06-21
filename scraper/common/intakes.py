"""Target intake cycles for non-EU applicants."""

from __future__ import annotations

TARGET_INTAKES = [
    {"season": "winter", "year": 2026, "label": "Winter 2026/27"},
    {"season": "summer", "year": 2027, "label": "Summer 2027"},
    {"season": "winter", "year": 2027, "label": "Winter 2027/28"},
]


def intake_label(season: str, year: int) -> str:
    if season == "winter":
        return f"Winter {year}/{str(year + 1)[-2:]}"
    return f"Summer {year}"
