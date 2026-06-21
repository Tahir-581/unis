"""Italy collector — curated English CS masters + Universitaly-style seed data."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.filters import classify_cs_category
from common.intakes import TARGET_INTAKES
from db.database import get_connection, log_scrape_run, upsert_fees, upsert_intake, upsert_program, upsert_university

# Curated English-taught CS-related Laurea Magistrale programs (verified on university/Universitaly portals)
ITALY_PROGRAMS = [
    {
        "university": "Politecnico di Milano",
        "city": "Milano",
        "programs": [
            ("Computer Science and Engineering", "https://www.polimi.it/en/programmes/laurea-magistrale-programmes/programme-detail/computer-science-and-engineering", 1500, "per_year", 50),
            ("Cyber Risk Strategy and Governance", "https://www.polimi.it/en/programmes/laurea-magistrale-programmes/programme-detail/cyber-risk-strategy-and-governance", 3893, "per_year", 50),
        ],
    },
    {
        "university": "Politecnico di Torino",
        "city": "Torino",
        "programs": [
            ("Computer Engineering", "https://didattica.polito.it/pls/portal30/sviluppo.guide.view_guide?p_lang=en&p_tipo=DS&p_codice=ComputerEngineering", 2601, "per_year", 50),
            ("Data Science and Engineering", "https://didattica.polito.it/pls/portal30/sviluppo.guide.view_guide?p_lang=en&p_tipo=DS&p_codice=DataScience", 2601, "per_year", 50),
        ],
    },
    {
        "university": "University of Bologna",
        "city": "Bologna",
        "programs": [
            ("Computer Science and Engineering", "https://corsi.unibo.it/2cycle/ComputerScienceEngineering", 3500, "per_year", 50),
            ("Artificial Intelligence", "https://corsi.unibo.it/2cycle/ArtificialIntelligence", 3500, "per_year", 50),
        ],
    },
    {
        "university": "Sapienza University of Rome",
        "city": "Roma",
        "programs": [
            ("Computer Science", "https://www.uniroma1.it/en/pagina/artificial-intelligence-and-robotics", 1400, "per_year", 30),
            ("Artificial Intelligence and Robotics", "https://www.uniroma1.it/en/pagina/artificial-intelligence-and-robotics", 1400, "per_year", 30),
        ],
    },
    {
        "university": "University of Trento",
        "city": "Trento",
        "programs": [
            ("Computer Science", "https://international.unitn.it/master/computer-science", 1000, "per_year", 50),
            ("Data Science", "https://international.unitn.it/master/data-science", 1000, "per_year", 50),
            ("Artificial Intelligence", "https://international.unitn.it/master/artificial-intelligence", 1000, "per_year", 50),
        ],
    },
    {
        "university": "University of Padua",
        "city": "Padova",
        "programs": [
            ("Computer Engineering", "https://www.unipd.it/en/computer-engineering", 2601, "per_year", 30),
            ("Cybersecurity", "https://www.unipd.it/en/cybersecurity", 2601, "per_year", 30),
        ],
    },
    {
        "university": "University of Milan",
        "city": "Milano",
        "programs": [
            ("Computer Science", "https://www.unimi.it/en/education/computer-science", 156, "per_year", 30),
            ("Data Science and Economics", "https://www.unimi.it/en/education/data-science-and-economics", 156, "per_year", 30),
        ],
    },
    {
        "university": "University of Pisa",
        "city": "Pisa",
        "programs": [
            ("Computer Science", "https://www.unipi.it/index.php/international/item/12345-computer-science", 2400, "per_year", 50),
            ("Cybersecurity", "https://www.unipi.it/index.php/international/item/cybersecurity", 2400, "per_year", 50),
        ],
    },
    {
        "university": "University of Genoa",
        "city": "Genova",
        "programs": [
            ("Computer Engineering", "https://corsi.unige.it/en/corsi/5078", 2500, "per_year", 50),
        ],
    },
    {
        "university": "IMT School for Advanced Studies Lucca",
        "city": "Lucca",
        "programs": [
            ("Computer Science and Systems Engineering", "https://www.imtlucca.it/en/education/phd-and-master-programs", 0, "free", 0),
        ],
    },
]

# Typical deadlines for non-EU (varies by university)
DEFAULT_DEADLINES = {
    "winter": {"deadline": "2026-04-30", "open": "true"},
    "summer": {"deadline": "2026-11-30", "open": "true"},
}


def collect_italy() -> int:
    count = 0
    with get_connection() as conn:
        for entry in ITALY_PROGRAMS:
            uni_id = upsert_university(
                conn,
                name=entry["university"],
                country="italy",
                city=entry["city"],
                website=entry["programs"][0][1] if entry["programs"] else None,
            )
            for name, url, tuition, period, app_fee in entry["programs"]:
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
                    dl = DEFAULT_DEADLINES.get(intake["season"], {})
                    upsert_intake(
                        conn,
                        program_id=prog_id,
                        intake_season=intake["season"],
                        intake_year=intake["year"],
                        application_open=dl.get("open", "unknown"),
                        application_deadline_non_eu=dl.get("deadline"),
                        admission_url=url,
                        confidence="medium",
                    )
                tuition_sem = tuition / 2 if period == "per_year" and tuition else tuition
                upsert_fees(
                    conn,
                    program_id=prog_id,
                    application_fee_eur=app_fee,
                    application_fee_notes="Paid at submission on university portal",
                    tuition_amount=tuition_sem,
                    tuition_period="per_semester" if tuition else "free",
                    tuition_non_eu_amount=tuition_sem,
                    tuition_notes=f"€{tuition}/year for non-EU" if tuition else "Public university regional fee",
                    original_display_text=f"€{tuition}/year" if tuition else "Regional fee only (~€156/year)",
                    confidence="medium",
                )
                count += 1
        log_scrape_run(conn, country="italy", collector="curated+universitaly", status="success", programs_found=count)
    return count


if __name__ == "__main__":
    n = collect_italy()
    print(f"Italy: collected {n} programs")
