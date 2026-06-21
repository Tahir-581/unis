"""Germany collector via DAAD International Programmes API."""

from __future__ import annotations

import re
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.filters import classify_cs_category, is_cs_master
from common.intakes import TARGET_INTAKES
from db.database import get_connection, log_scrape_run, upsert_fees, upsert_intake, upsert_program, upsert_university

DAAD_API = "https://www2.daad.de/deutschland/studienangebote/international-programmes/api/solr/en/search.json"
DAAD_BASE = "https://www2.daad.de/deutschland/studienangebote/international-programmes/en/detail"
HEADERS = {"User-Agent": "unis-dashboard/1.0 (research/education)"}

CS_QUERY = (
    'informatics OR "computer science" OR "software engineering" OR cybersecurity OR '
    '"data science" OR "artificial intelligence" OR "machine learning" OR '
    '"information technology" OR computing'
)


def parse_deadline_html(html: str) -> dict[str, str | None]:
    """Extract winter/summer non-EU deadlines from DAAD HTML snippet."""
    if not html:
        return {}
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    result: dict[str, str | None] = {}
    non_eu = re.search(
        r"Non-EU[^:]*:\s*(\d{1,2}\s+\w+\s+for the following (winter|summer) semester)",
        text,
        re.I,
    )
    if non_eu:
        result[f"non_eu_{non_eu.group(2).lower()}"] = non_eu.group(1)
    for m in re.finditer(r"(\d{1,2}\s+\w+)\s+for the following (winter|summer) semester", text, re.I):
        result[f"{m.group(2).lower()}_general"] = m.group(1)
    return result


def parse_tuition(tuition: str | None) -> tuple[float | None, str, str | None]:
    if not tuition or tuition.lower() in ("none", "no", "free", ""):
        return 0.0, "free", "No tuition fees"
    text = tuition.lower()
    amount_match = re.search(r"(\d[\d.,]*)\s*€", tuition)
    amount = None
    if amount_match:
        amount = float(amount_match.group(1).replace(".", "").replace(",", "."))
    period = "unknown"
    if "semester" in text:
        period = "per_semester"
    elif "year" in text or "annual" in text:
        period = "per_year"
    return amount, period, tuition


def fetch_daad_page(start: int = 0, rows: int = 100) -> tuple[list[dict], int]:
    params = {"wt": "json", "q": CS_QUERY, "fq": "degree:2", "rows": rows, "start": start}
    resp = requests.get(DAAD_API, params=params, headers=HEADERS, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data.get("courses", []), data.get("numResults", 0)


def collect_germany() -> int:
    count = 0
    start = 0
    rows = 100
    seen: set[str] = set()

    with get_connection() as conn:
        while True:
            try:
                courses, total = fetch_daad_page(start, rows)
            except Exception as e:
                log_scrape_run(conn, country="germany", collector="daad", status="failed", programs_found=count, error_message=str(e))
                break

            if not courses:
                break

            for course in courses:
                title = course.get("courseName") or course.get("courseNameShort") or ""
                if not title or not is_cs_master(title, course.get("subject", "")):
                    continue

                languages = course.get("languages") or []
                if languages and "English" not in languages:
                    continue

                uni_name = course.get("academy") or "Unknown"
                city = course.get("city") or ""
                key = f"{uni_name}|{title}".lower()
                if key in seen:
                    continue
                seen.add(key)

                course_id = course.get("id")
                source_url = f"{DAAD_BASE}/{course_id}/" if course_id else None

                uni_id = upsert_university(conn, name=uni_name, country="germany", city=city)
                prog_id = upsert_program(
                    conn,
                    university_id=uni_id,
                    official_name=title,
                    english_name=title,
                    ects=120,
                    duration_months=24,
                    language="english",
                    cs_category=classify_cs_category(title),
                    source_url=source_url,
                    catalog_confidence="high",
                    external_id=str(course_id),
                )

                deadlines = parse_deadline_html(course.get("applicationDeadline") or "")
                beginning = (course.get("beginning") or "").lower()

                for intake in TARGET_INTAKES:
                    season = intake["season"]
                    deadline = deadlines.get(f"non_eu_{season}") or deadlines.get(f"{season}_general")
                    app_open = "unknown"
                    if deadline:
                        app_open = "true"

                    if season == "winter" and "winter" not in beginning and beginning and "summer" in beginning and season == "winter":
                        pass  # still create intake row

                    upsert_intake(
                        conn,
                        program_id=prog_id,
                        intake_season=season,
                        intake_year=intake["year"],
                        application_open=app_open,
                        application_deadline_non_eu=deadline,
                        admission_url=source_url,
                        confidence="high" if deadline else "medium",
                    )

                tuition_amount, tuition_period, tuition_text = parse_tuition(course.get("tuitionFees"))
                upsert_fees(
                    conn,
                    program_id=prog_id,
                    application_fee_notes="Check university portal; many use uni-assist (€75 first, €30 additional)",
                    tuition_amount=tuition_amount,
                    tuition_period=tuition_period,
                    tuition_non_eu_amount=tuition_amount,
                    tuition_notes=course.get("costString") or "",
                    original_display_text=tuition_text or course.get("tuitionFees") or "See DAAD listing",
                    confidence="high" if tuition_text else "medium",
                )
                count += 1

            start += rows
            if start >= total:
                break
            time.sleep(0.3)

        log_scrape_run(conn, country="germany", collector="daad", status="success", programs_found=count)

    return count


if __name__ == "__main__":
    n = collect_germany()
    print(f"Germany: collected {n} programs")
