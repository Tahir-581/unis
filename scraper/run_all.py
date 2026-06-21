#!/usr/bin/env python3
"""Run all country collectors and enrichment pipeline."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from countries.belgium import collect_belgium
from countries.germany import collect_germany
from countries.italy import collect_italy
from countries.portugal import collect_portugal
from countries.spain import collect_spain
from db.database import init_db
from enrich.enrichment import run_enrichment
from enrich.normalize_deadlines import normalize_all


def main() -> None:
    init_db()
    results = {
        "germany": collect_germany(),
        "italy": collect_italy(),
        "portugal": collect_portugal(),
        "spain": collect_spain(),
        "belgium": collect_belgium(),
    }
    enriched = run_enrichment(limit=50)
    normalized = normalize_all()
    print("\n=== Collection Summary ===")
    for country, count in results.items():
        print(f"  {country}: {count} programs")
    print(f"  enriched: {enriched} programs")
    print(f"  normalized deadlines: {normalized}")
    print(f"  total: {sum(results.values())} programs")


if __name__ == "__main__":
    main()
