-- Migration 007: Outreach automation state
-- Tracks audit-led outbound state directly inside prospects so Zypflow can run
-- scraping -> audit -> email outreach -> follow-up without relying on an external sequencer.

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES audits(id) ON DELETE SET NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS audit_score INTEGER;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS audit_top_leak TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS outreach_stage INTEGER DEFAULT 0;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_email_subject TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_email_preview TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_email_provider TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS sequence_name TEXT;

CREATE INDEX IF NOT EXISTS idx_prospects_next_follow_up ON prospects(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_prospects_audit_id ON prospects(audit_id);
