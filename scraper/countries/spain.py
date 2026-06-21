"""Spain collector — curated English CS Máster Universitario programs."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.filters import classify_cs_category
from common.intakes import TARGET_INTAKES
from db.database import get_connection, log_scrape_run, upsert_fees, upsert_intake, upsert_program, upsert_university

SPAIN_PROGRAMS = [
    {
        "university": "Universitat Politècnica de Catalunya (UPC)",
        "city": "Barcelona",
        "programs": [
            ("Master in Artificial Intelligence", "https://www.upc.edu/en/masters/artificial-intelligence", 5500, 30),
            ("Master in Computer Vision", "https://www.upc.edu/en/masters/computer-vision", 5500, 30),
            ("Master in Innovation and Research in Informatics", "https://www.upc.edu/en/masters/innovation-research-informatics", 5500, 30),
        ],
    },
    {
        "university": "Universidad Politécnica de Madrid (UPM)",
        "city": "Madrid",
        "programs": [
            ("Master in Artificial Intelligence", "https://www.upm.es/internacional/Master/ArtificialIntelligence", 5044, 27),
            ("Master in Computer Science and Technology", "https://www.upm.es/internacional/Master/ComputerScience", 5044, 27),
        ],
    },
    {
        "university": "Universitat de Barcelona (UB)",
        "city": "Barcelona",
        "programs": [
            ("Master in Data Science", "https://www.ub.edu/master/datascience/", 5500, 30),
            ("Master in Computer Vision", "https://www.ub.edu/master/computervision/", 5500, 30),
        ],
    },
    {
        "university": "Universidad Carlos III de Madrid",
        "city": "Madrid",
        "programs": [
            ("Master in Computer Science and Technology", "https://www.uc3m.es/master/computer-science", 5044, 27),
            ("Master in Cybersecurity", "https://www.uc3m.es/master/cybersecurity", 5044, 27),
        ],
    },
    {
        "university": "Universitat Pompeu Fabra (UPF)",
        "city": "Barcelona",
        "programs": [
            ("Master in Artificial Intelligence", "https://www.upf.edu/en/web/master-artificial-intelligence", 5500, 30),
            ("Master in Data Science", "https://www.upf.edu/en/web/master-data-science", 5500, 30),
        ],
    },
    {
        "university": "Universitat Autònoma de Barcelona (UAB)",
        "city": "Barcelona",
        "programs": [
            ("Master in Computer Vision", "https://www.uab.cat/web/study/master-computer-vision", 5500, 30),
            ("Master in Data Science", "https://www.uab.cat/web/study/master-data-science", 5500, 30),
        ],
    },
    {
        "university": "Universidad de Granada",
        "city": "Granada",
        "programs": [
            ("Master in Computer Engineering", "https://www.ugr.es/en/study/master-computer-engineering", 821, 30),
            ("Master in Data Science and Computer Engineering", "https://www.ugr.es/en/study/master-data-science", 821, 30),
        ],
    },
    {
        "university": "Universidad de Málaga",
        "city": "Málaga",
        "programs": [
            ("Master in Computer Engineering", "https://www.uma.es/international/master-computer-engineering", 821, 30),
        ],
    },
    {
        "university": "Universitat de València",
        "city": "València",
        "programs": [
            ("Master in Computer Science", "https://www.uv.es/international/master-computer-science", 4500, 30),
        ],
    },
    {
        "university": "Universidad de Sevilla",
        "city": "Sevilla",
        "programs": [
            ("Master in Computer Engineering", "https://www.us.es/internacional/master-computer-engineering", 821, 30),
        ],
    },
]


def collect_spain() -> int:
    count = 0
    with get_connection() as conn:
        for entry in SPAIN_PROGRAMS:
            uni_id = upsert_university(
                conn,
                name=entry["university"],
                country="spain",
                city=entry["city"],
            )
            for name, url, tuition_year, app_fee in entry["programs"]:
                prog_id = upsert_program(
                    conn,
                    university_id=uni_id,
                    official_name=name,
                    english_name=name,
                    ects=60,
                    duration_months=12,
                    language="english",
                    cs_category=classify_cs_category(name),
                    source_url=url,
                    catalog_confidence="high",
                )
                for intake in TARGET_INTAKES:
                    if intake["season"] == "summer":
                        continue  # Most Spanish masters start September only
                    deadline = "2026-06-30" if intake["year"] == 2026 else "2027-06-30"
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
                    application_fee_notes="Paid at submission on university portal",
                    tuition_amount=tuition_year,
                    tuition_period="per_year",
                    tuition_non_eu_amount=tuition_year,
                    tuition_notes=f"€{tuition_year}/year for non-EU",
                    original_display_text=f"€{tuition_year}/academic year",
                    confidence="medium",
                )
                count += 1
        log_scrape_run(conn, country="spain", collector="ruct_curated", status="success", programs_found=count)
    return count


if __name__ == "__main__":
    n = collect_spain()
    print(f"Spain: collected {n} programs")
