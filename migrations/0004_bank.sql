-- The bank holds puzzle days by number (the template, re-tiered nightly).
-- `puzzles` keeps what each date actually served, frozen on first use.
CREATE TABLE IF NOT EXISTS bank (
  day INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
