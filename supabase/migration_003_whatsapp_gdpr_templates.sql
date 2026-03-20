-- Migration 003: WhatsApp, GDPR compliance, workflow templates, agency support
-- Run in Supabase SQL Editor

-- GDPR consent tracking (required for UK GDPR and Data Use & Access Act 2025)
CREATE TABLE IF NOT EXISTS gdpr_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  consent_type TEXT NOT NULL DEFAULT 'marketing' CHECK (consent_type IN ('marketing', 'service', 'transactional')),
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  obtained_via TEXT NOT NULL DEFAULT 'signup',
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_consents_contact ON gdpr_consents(contact_id, channel);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_business ON gdpr_consents(business_id);

-- GDPR audit log (immutable — no UPDATE or DELETE allowed)
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  contact_id UUID,
  business_id UUID,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  data_fields_accessed TEXT[]
);

-- Workflow templates (one-click deployable automation templates)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  actions_json JSONB NOT NULL,
  featured BOOLEAN DEFAULT false,
  setup_minutes INTEGER DEFAULT 5,
  icon TEXT DEFAULT 'zap',
  minutes_saved_per_run INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Business credentials per business
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_access_token TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS avg_job_value INTEGER DEFAULT 150;

-- Workspace type for agency white-label support
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS workspace_type TEXT DEFAULT 'standard';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES businesses(id);

-- RLS policies
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to workflow templates"
  ON workflow_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role only for gdpr_consents"
  ON gdpr_consents FOR ALL TO service_role USING (true);

CREATE POLICY "Service role only for gdpr_audit_log"
  ON gdpr_audit_log FOR ALL TO service_role USING (true);

-- Prevent modification of audit log (immutable for compliance)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'GDPR audit log is immutable — updates and deletes are not allowed';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_audit_log_update ON gdpr_audit_log;
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE OR DELETE ON gdpr_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
