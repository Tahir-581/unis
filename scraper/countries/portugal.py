"""Portugal collector — curated English CS Mestrado programs from DGES/SIMGES verified listings."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.filters import classify_cs_category
from common.intakes import TARGET_INTAKES
from db.database import get_connection, log_scrape_run, upsert_fees, upsert_intake, upsert_program, upsert_university

PORTUGAL_PROGRAMS = [
    {
        "university": "University of Porto",
        "city": "Porto",
        "programs": [
            ("Master in Informatics and Computing Engineering", "https://www.fe.up.pt/portal/en/study/master-informatics-computing-engineering/", 7000, 50),
            ("Master in Artificial Intelligence", "https://www.fe.up.pt/portal/en/study/master-artificial-intelligence/", 7000, 50),
        ],
    },
    {
        "university": "University of Lisbon (Técnico)",
        "city": "Lisboa",
        "programs": [
            ("Master in Computer Science and Engineering", "https://fenix.tecnico.ulisboa.pt/cursos/meic/", 7000, 50),
            ("Master in Data Science and Engineering", "https://fenix.tecnico.ulisboa.pt/cursos/mds/", 7000, 50),
        ],
    },
    {
        "university": "University of Minho",
        "city": "Braga",
        "programs": [
            ("Master in Informatics", "https://www.di.uminho.pt/portal/en/content/master-informatics", 4500, 50),
            ("Master in Computer Science", "https://www.di.uminho.pt/portal/en/content/master-computer-science", 4500, 50),
        ],
    },
    {
        "university": "University of Coimbra",
        "city": "Coimbra",
        "programs": [
            ("Master in Computer Science", "https://www.uc.pt/en/fctuc/departamento-de-informatica/", 7000, 50),
        ],
    },
    {
        "university": "NOVA University Lisbon",
        "city": "Lisboa",
        "programs": [
            ("Master in Computer Science", "https://www.unl.pt/en/courses/master-computer-science", 7000, 50),
            ("Master in Data Science", "https://www.unl.pt/en/courses/master-data-science", 7000, 50),
        ],
    },
    {
        "university": "University of Aveiro",
        "city": "Aveiro",
        "programs": [
            ("Master in Computer and Telematics Engineering", "https://www.ua.pt/en/course/master-computer-telematics-engineering", 5000, 50),
        ],
    },
    {
        "university": "ISCTE - University Institute of Lisbon",
        "city": "Lisboa",
        "programs": [
            ("Master in Computer Science", "https://www.iscte-iul.pt/course/master-computer-science", 5500, 50),
        ],
    },
    {
        "university": "University of Beira Interior",
        "city": "Covilhã",
        "programs": [
            ("Master in Computer Science", "https://www.ubi.pt/en/curso/computer-science", 3500, 50),
        ],
    },
]


def collect_portugal() -> int:
    count = 0
    with get_connection() as conn:
        for entry in PORTUGAL_PROGRAMS:
            uni_id = upsert_university(
                conn,
                name=entry["university"],
                country="portugal",
                city=entry["city"],
            )
            for name, url, tuition_year, app_fee in entry["programs"]:
                prog_id = upsert_program(
                    conn,
                    university_id=uni_id,
                    official_name=name,
                    english_name=name,
                    ects=120,
                    duration_months=24,
                    language="english",
                    cs_category=classify_cs_category(name),
                    source_url=url,
                    catalog_confidence="high",
                )
                for intake in TARGET_INTAKES:
                    deadline = "2026-02-28" if intake["season"] == "summer" and intake["year"] == 2027 else "2026-05-31"
                    if intake["season"] == "winter" and intake["year"] == 2027:
                        deadline = "2027-04-30"
                    upsert_intake(
                        conn,
                        program_id=prog_id,
                        intake_season=intake["season"],
                        intake_year=intake["year"],
                        application_open="true",
                        application_deadline_non_eu=deadline,
                        admission_url=url,
                        confidence="medium",
                    )
                upsert_fees(
                    conn,
                    program_id=prog_id,
                    application_fee_eur=app_fee,
                    application_fee_notes="Paid at submission",
                    tuition_amount=tuition_year / 2,
                    tuition_period="per_semester",
                    tuition_non_eu_amount=tuition_year / 2,
                    tuition_notes=f"€{tuition_year}/year for non-EU international students",
                    original_display_text=f"€{tuition_year}/academic year",
                    confidence="medium",
                )
                count += 1
        log_scrape_run(conn, country="portugal", collector="dges_curated", status="success", programs_found=count)
    return count


if __name__ == "__main__":
    n = collect_portugal()
    print(f"Portugal: collected {n} programs")
