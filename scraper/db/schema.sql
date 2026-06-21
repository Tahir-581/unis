-- EU CS Master's Application Dashboard schema

CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL CHECK (country IN ('germany', 'italy', 'spain', 'belgium', 'portugal')),
    city TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(name, country, city)
);

CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    official_name TEXT NOT NULL,
    english_name TEXT,
    degree_type TEXT DEFAULT 'master',
    ects INTEGER,
    duration_months INTEGER,
    language TEXT DEFAULT 'english',
    cs_category TEXT CHECK (cs_category IN (
        'informatics', 'cs_engineering', 'data_science', 'ai', 'cybersecurity', 'software', 'other'
    )),
    source_url TEXT,
    catalog_confidence TEXT DEFAULT 'medium' CHECK (catalog_confidence IN ('high', 'medium', 'low', 'manual')),
    external_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(university_id, official_name)
);

CREATE TABLE IF NOT EXISTS program_intakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    intake_season TEXT NOT NULL CHECK (intake_season IN ('winter', 'summer')),
    intake_year INTEGER NOT NULL,
    application_open TEXT DEFAULT 'unknown' CHECK (application_open IN ('true', 'false', 'unknown')),
    application_deadline TEXT,
    application_deadline_non_eu TEXT,
    classes_start TEXT,
    admission_url TEXT,
    last_verified_at TEXT,
    confidence TEXT DEFAULT 'low' CHECK (confidence IN ('high', 'medium', 'low', 'manual')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(program_id, intake_season, intake_year)
);

CREATE TABLE IF NOT EXISTS program_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    application_fee_eur REAL,
    application_fee_notes TEXT,
    tuition_amount REAL,
    tuition_period TEXT CHECK (tuition_period IN ('per_semester', 'per_year', 'total_program', 'free', 'unknown')),
    tuition_non_eu_amount REAL,
    tuition_notes TEXT,
    original_display_text TEXT,
    last_verified_at TEXT,
    confidence TEXT DEFAULT 'low' CHECK (confidence IN ('high', 'medium', 'low', 'manual')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(program_id)
);

CREATE TABLE IF NOT EXISTS user_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_intake_id INTEGER NOT NULL REFERENCES program_intakes(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL DEFAULT 'default',
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'submitted', 'done')),
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(program_intake_id, client_id)
);

CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT,
    collector TEXT,
    status TEXT CHECK (status IN ('success', 'partial', 'failed')),
    programs_found INTEGER DEFAULT 0,
    programs_enriched INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_programs_university ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_intakes_program ON program_intakes(program_id);
CREATE INDEX IF NOT EXISTS idx_intakes_deadline ON program_intakes(application_deadline);
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country);
