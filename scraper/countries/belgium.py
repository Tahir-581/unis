"""Belgium collector — Flanders + Wallonia English CS masters."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.filters import classify_cs_category
from common.intakes import TARGET_INTAKES
from db.database import get_connection, log_scrape_run, upsert_fees, upsert_intake, upsert_program, upsert_university

BELGIUM_PROGRAMS = [
    {
        "university": "KU Leuven",
        "city": "Leuven",
        "region": "Flanders",
        "programs": [
            ("Master of Artificial Intelligence", "https://www.kuleuven.be/programmes/master-artificial-intelligence", 6670, 0),
            ("Master of Computer Science", "https://www.kuleuven.be/programmes/master-computer-science", 6670, 0),
            ("Master of Cybersecurity", "https://www.kuleuven.be/programmes/master-cybersecurity", 6670, 0),
        ],
    },
    {
        "university": "Ghent University",
        "city": "Ghent",
        "region": "Flanders",
        "programs": [
            ("Master of Science in Computer Science Engineering", "https://www.ugent.be/en/education/master-programmes/computer-science-engineering", 5800, 0),
            ("Master of Science in Data Science", "https://www.ugent.be/en/education/master-programmes/data-science", 5800, 0),
        ],
    },
    {
        "university": "Vrije Universiteit Brussel (VUB)",
        "city": "Brussels",
        "region": "Flanders",
        "programs": [
            ("Master in Computer Science", "https://www.vub.be/en/study/computer-science", 5800, 0),
            ("Master in Applied Computer Science", "https://www.vub.be/en/study/applied-computer-science", 5800, 0),
        ],
    },
    {
        "university": "University of Antwerp",
        "city": "Antwerp",
        "region": "Flanders",
        "programs": [
            ("Master in Computer Science", "https://www.uantwerpen.be/en/study/programmes/computer-science/", 5800, 0),
            ("Master in Data Science", "https://www.uantwerpen.be/en/study/programmes/data-science/", 5800, 0),
        ],
    },
    {
        "university": "Université catholique de Louvain (UCLouvain)",
        "city": "Louvain-la-Neuve",
        "region": "Wallonia",
        "programs": [
            ("Master in Computer Science and Engineering", "https://www.uclouvain.be/en/our-degree-programmes/master-computer-science", 4175, 0),
            ("Master in Data Science", "https://www.uclouvain.be/en/our-degree-programmes/master-data-science", 4175, 0),
        ],
    },
    {
        "university": "Université libre de Bruxelles (ULB)",
        "city": "Brussels",
        "region": "Wallonia",
        "programs": [
            ("Master in Computer Science", "https://www.ulb.be/en/programme/master-computer-science", 4175, 0),
            ("Master in Artificial Intelligence", "https://www.ulb.be/en/programme/master-artificial-intelligence", 4175, 0),
        ],
    },
    {
        "university": "Université de Liège (ULiège)",
        "city": "Liège",
        "region": "Wallonia",
        "programs": [
            ("Master in Computer Science", "https://www.programmes.uliege.be/cocoon/20252026/en/Programme/MA-CS.html", 4175, 0),
            ("Master in Data Science", "https://www.programmes.uliege.be/cocoon/20252026/en/Programme/MA-DS.html", 4175, 0),
        ],
    },
    {
        "university": "Université de Namur (UNamur)",
        "city": "Namur",
        "region": "Wallonia",
        "programs": [
            ("Master in Computer Science", "https://www.unamur.be/en/formation/master-computer-science", 4175, 0),
        ],
    },
    {
        "university": "Hasselt University",
        "city": "Hasselt",
        "region": "Flanders",
        "programs": [
            ("Master in Computer Science", "https://www.uhasselt.be/en/study/programmes/master-computer-science", 5800, 0),
        ],
    },
]


def collect_belgium() -> int:
    count = 0
    with get_connection() as conn:
        for entry in BELGIUM_PROGRAMS:
            uni_id = upsert_university(
                conn,
                name=entry["university"],
                country="belgium",
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
                    if intake["season"] == "summer" and intake["year"] == 2027:
                        continue
                    deadline = "2026-03-01" if intake["year"] == 2026 else "2027-03-01"
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
                    application_fee_notes="No application fee at most Belgian universities",
                    tuition_amount=tuition_year / 2,
                    tuition_period="per_semester",
                    tuition_non_eu_amount=tuition_year / 2,
                    tuition_notes=f"Non-EU: ~€{tuition_year}/year (Flanders/Wallonia rates differ)",
                    original_display_text=f"€{tuition_year}/academic year (non-EU)",
                    confidence="medium",
                )
                count += 1
        log_scrape_run(conn, country="belgium", collector="hor_studyinbelgium", status="success", programs_found=count)
    return count


if __name__ == "__main__":
    n = collect_belgium()
    print(f"Belgium: collected {n} programs")
