# EU CS Master's Application Dashboard

Track English-taught Computer Science Master's programs across **Germany, Italy, Spain, Belgium, and Portugal** — built for non-EU international applicants.

## Features

- **Country selector** with program counts and upcoming deadline stats
- **Top 5 urgent deadlines** banner (always visible)
- Full program details: intakes, open/closed status, deadlines, application fees, tuition
- **Done / not done** checklist with notes (persisted in browser localStorage)
- Filters: open only, deadline window, free tuition, no app fee, search, sort
- CSV export
- Manual override for fields you verify on university portals
- Stale-data warnings when data is older than 14 days
- Weekly GitHub Actions scrape job

## Quick start

### 1. Collect data

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scraper/requirements.txt
python scraper/run_all.py
```

This creates `data/unis.db` with programs from all five countries.

### 2. Run dashboard

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
unis/
├── scraper/           # Python data pipeline
│   ├── countries/     # Per-country collectors
│   ├── enrich/        # Deadline/fee enrichment + normalization
│   ├── db/            # SQLite schema and helpers
│   └── run_all.py     # Run full pipeline
├── data/unis.db       # SQLite database (generated)
└── web/               # Next.js dashboard
```

## Data sources

| Country  | Primary source                                      |
|----------|-----------------------------------------------------|
| Germany  | DAAD International Programmes API                   |
| Italy    | Curated Universitaly / university portal listings   |
| Spain    | Curated RUCT / university international listings    |
| Belgium  | Study in Flanders + studyinbelgium.be listings      |
| Portugal | Curated DGES / SIMGES listings                      |

Operational data (deadlines, fees) is enriched from university admission pages where possible. Always verify on the official portal before applying.

## Refresh schedule

During application season, run `python scraper/run_all.py` weekly. A GitHub Actions workflow (`.github/workflows/weekly-scrape.yml`) automates this on a schedule.

## Target intakes

- Winter 2026/27
- Summer 2027
- Winter 2027/28

## Accuracy notes

National registries confirm program existence; university portals are the source of truth for deadlines and fees. The dashboard shows confidence levels, last-verified dates, and source links — use manual override after you verify details yourself.
