"""Per-university enrichment for deadlines, fees, and application status."""

from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db.database import get_connection, log_scrape_run, upsert_fees, upsert_intake

HEADERS = {"User-Agent": "unis-dashboard/1.0 (research/education)"}
MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def parse_date_from_text(text: str) -> str | None:
    """Try to extract ISO date from free text."""
    text = re.sub(r"\s+", " ", text)
    # DD Month YYYY
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", text)
    if m:
        day, month_str, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
        month = MONTH_MAP.get(month_str[:3]) or MONTH_MAP.get(month_str)
        if month:
            return f"{year}-{month:02d}-{day:02d}"
    # YYYY-MM-DD
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    if m:
        return m.group(0)
    # DD.MM.YYYY
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", text)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    return None


def extract_fees_from_page(html: str) -> dict:
    text = BeautifulSoup(html, "lxml").get_text(" ", strip=True)
    result: dict = {}
    app_fee = re.search(r"application\s+fee[s]?\s*[:\s]*€?\s*(\d+(?:[.,]\d+)?)", text, re.I)
    if app_fee:
        result["application_fee_eur"] = float(app_fee.group(1).replace(",", "."))
    tuition = re.search(r"tuition\s+fee[s]?\s*[:\s]*€?\s*(\d+(?:[.,]\d+)?)\s*(?:per\s+)?(semester|year|month)", text, re.I)
    if tuition:
        result["tuition_amount"] = float(tuition.group(1).replace(",", "."))
        period = tuition.group(2).lower()
        result["tuition_period"] = "per_semester" if "semester" in period else "per_year"
    if re.search(r"no\s+tuition|tuition[- ]free|free\s+of\s+charge", text, re.I):
        result["tuition_amount"] = 0
        result["tuition_period"] = "free"
    return result


def extract_deadlines_from_page(html: str) -> list[str]:
    text = BeautifulSoup(html, "lxml").get_text(" ", strip=True)
    dates = []
    for pattern in [
        r"deadline[s]?\s*[:\s]*(\d{1,2}\s+\w+\s+\d{4})",
        r"apply\s+by\s+(\d{1,2}\s+\w+\s+\d{4})",
        r"application\s+period[^.]*?(\d{1,2}\s+\w+\s+\d{4})",
        r"(\d{1,2}\.\d{1,2}\.\d{4})",
    ]:
        for m in re.finditer(pattern, text, re.I):
            parsed = parse_date_from_text(m.group(1))
            if parsed:
                dates.append(parsed)
    return dates


def infer_application_open(deadline: str | None) -> str:
    if not deadline:
        return "unknown"
    try:
        dl = datetime.strptime(deadline[:10], "%Y-%m-%d")
        return "true" if dl >= datetime.now() else "false"
    except ValueError:
        return "unknown"


def enrich_program(source_url: str | None) -> dict:
    if not source_url or not source_url.startswith("http"):
        return {}
    try:
        resp = requests.get(source_url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return {}
        html = resp.text
        fees = extract_fees_from_page(html)
        deadlines = extract_deadlines_from_page(html)
        if deadlines:
            fees["nearest_deadline"] = min(deadlines)
            fees["application_open"] = infer_application_open(fees["nearest_deadline"])
        return fees
    except Exception:
        return {}


def run_enrichment(limit: int | None = None) -> int:
    enriched = 0
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT p.id AS program_id, p.source_url, pi.id AS intake_id
            FROM programs p
            JOIN program_intakes pi ON pi.program_id = p.id
            WHERE p.source_url IS NOT NULL
            ORDER BY p.id, pi.intake_year
            """
        ).fetchall()

        seen_urls: set[str] = set()
        for row in rows:
            url = row["source_url"]
            if url in seen_urls:
                continue
            seen_urls.add(url)

            data = enrich_program(url)
            if not data:
                continue

            if data.get("nearest_deadline"):
                conn.execute(
                    """
                    UPDATE program_intakes SET
                        application_deadline_non_eu = COALESCE(?, application_deadline_non_eu),
                        application_open = ?,
                        last_verified_at = datetime('now'),
                        confidence = 'high'
                    WHERE program_id = ?
                    """,
                    (data["nearest_deadline"], data.get("application_open", "unknown"), row["program_id"]),
                )

            if any(k in data for k in ("application_fee_eur", "tuition_amount", "tuition_period")):
                upsert_fees(
                    conn,
                    program_id=row["program_id"],
                    application_fee_eur=data.get("application_fee_eur"),
                    tuition_amount=data.get("tuition_amount"),
                    tuition_period=data.get("tuition_period", "unknown"),
                    confidence="high",
                )

            enriched += 1
            if limit and enriched >= limit:
                break

        log_scrape_run(conn, country="all", collector="enrichment", status="success", programs_enriched=enriched)

    return enriched


if __name__ == "__main__":
    n = run_enrichment()
    print(f"Enriched {n} programs")
