-- Add retry support to scheduled_actions (dead-letter queue pattern)
ALTER TABLE scheduled_actions
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Allow 'retrying' status
ALTER TABLE scheduled_actions DROP CONSTRAINT IF EXISTS scheduled_actions_status_check;
ALTER TABLE scheduled_actions ADD CONSTRAINT scheduled_actions_status_check
  CHECK (status IN ('pending', 'executed', 'failed', 'cancelled', 'retrying', 'dead_letter'));

-- Index for retry processing
CREATE INDEX IF NOT EXISTS idx_scheduled_retrying
  ON scheduled_actions(next_retry_at)
  WHERE status = 'retrying';

-- Dead-letter audit log — tracks every failed attempt for debugging
CREATE TABLE IF NOT EXISTS automation_dead_letter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES scheduled_actions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  attempt_number INT NOT NULL,
  error_message TEXT NOT NULL,
  error_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_org ON automation_dead_letter(org_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_action ON automation_dead_letter(action_id);

ALTER TABLE automation_dead_letter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON automation_dead_letter FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
