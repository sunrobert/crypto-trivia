CREATE TABLE IF NOT EXISTS rejections (
  date TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  raw TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rejections_prompt ON rejections(prompt_id);
