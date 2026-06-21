#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r scraper/requirements.txt
.venv/bin/python scraper/run_all.py
mkdir -p web/data
cp data/unis.db web/data/unis.db

echo ""
echo "Dashboard: cd web && npm install && npm run dev"
