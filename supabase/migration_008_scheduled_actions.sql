CREATE TABLE IF NOT EXISTS scheduled_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  template_id TEXT,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_pending ON scheduled_actions(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scheduled_org ON scheduled_actions(org_id);

ALTER TABLE scheduled_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON scheduled_actions FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
