CREATE TABLE IF NOT EXISTS user_applications (
  intake_key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'submitted', 'done', 'rejected')),
  rejection_reason TEXT
    CHECK (rejection_reason IS NULL OR rejection_reason IN (
      'application_fees', 'deadline_passed', 'document', 'other'
    )),
  rejection_document TEXT,
  rejection_note TEXT,
  notes TEXT,
  overrides JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
