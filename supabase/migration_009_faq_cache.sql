-- Migration 009: FAQ cache table for AI cost reduction
-- Caches common question/answer pairs per business to avoid redundant AI calls

CREATE TABLE IF NOT EXISTS faq_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  question_hash TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(org_id, question_hash)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_faq_cache_lookup
  ON faq_cache(org_id, question_hash)
  WHERE expires_at > now();

-- RLS
ALTER TABLE faq_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their FAQ cache"
  ON faq_cache FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Convenience function for incrementing hit count
CREATE OR REPLACE FUNCTION increment_faq_hit_count(row_id UUID)
RETURNS void AS $$
  UPDATE faq_cache SET hit_count = hit_count + 1 WHERE id = row_id;
$$ LANGUAGE sql;
