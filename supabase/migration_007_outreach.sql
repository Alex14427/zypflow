-- Outreach sequences tracking
CREATE TABLE IF NOT EXISTS outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  sequence_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replied_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outreach_org ON outreach(org_id);
CREATE INDEX idx_outreach_status ON outreach(org_id, status);
CREATE INDEX idx_outreach_lead ON outreach(lead_id);

ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON outreach FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Nurture sequences
CREATE TABLE IF NOT EXISTS nurture_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  sequence_name TEXT DEFAULT 'default',
  sequence_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nurture_org ON nurture_sequences(org_id);
CREATE INDEX idx_nurture_next ON nurture_sequences(next_send_at) WHERE status = 'active';

ALTER TABLE nurture_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON nurture_sequences FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
