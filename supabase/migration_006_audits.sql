-- Migration 006: Website audit results table
-- Stores PageSpeed / SEO audit results for the free audit tool

CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  email TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  -- PageSpeed scores (0-100)
  score_performance INTEGER,
  score_accessibility INTEGER,
  score_best_practices INTEGER,
  score_seo INTEGER,
  -- Derived checks
  is_mobile_friendly BOOLEAN,
  has_ssl BOOLEAN,
  -- Full API response for deep-dive
  raw_results JSONB DEFAULT '{}',
  -- AI-generated summary (gated behind email)
  ai_summary TEXT,
  -- PDF report URL (stored in Supabase Storage or generated on-demand)
  report_url TEXT,
  -- Tracking
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audits_email ON audits(email);
CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);
CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at DESC);

-- No RLS needed — this is a public-facing tool (no org_id required for public audits)
-- Lead pipeline creates org-scoped leads separately
