-- Migration 004: Migrate from businesses to businesses + org_members
-- This is the multi-tenant foundation. Run in Supabase SQL Editor.
-- IMPORTANT: Run this AFTER all previous migrations.

-- ============================================
-- STEP 1: Create businesses table
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  industry TEXT DEFAULT 'general',
  plan TEXT DEFAULT 'trial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  ai_personality TEXT DEFAULT 'friendly and professional',
  system_prompt TEXT,
  knowledge_base JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  booking_url TEXT,
  google_review_link TEXT,
  widget_color TEXT DEFAULT '#6c3cff',
  timezone TEXT DEFAULT 'Europe/London',
  active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  -- WhatsApp fields (from migration_003)
  wa_phone_number_id TEXT,
  wa_access_token TEXT,
  avg_job_value INTEGER DEFAULT 150,
  -- Agency support
  workspace_type TEXT DEFAULT 'standard',
  agency_id UUID REFERENCES businesses(id),
  -- Credits (for future metering)
  scraping_credits INTEGER DEFAULT 0,
  email_credits INTEGER DEFAULT 0,
  ai_credits INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{"brand_color":"#6c3cff","logo_url":null}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STEP 2: Create org_members table
-- ============================================

CREATE TABLE IF NOT EXISTS org_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_email TEXT,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ============================================
-- STEP 3: Migrate data from businesses → businesses
-- ============================================

INSERT INTO businesses (
  id, name, email, phone, website, industry, plan,
  stripe_customer_id, stripe_subscription_id,
  ai_personality, system_prompt, knowledge_base, services,
  booking_url, google_review_link, widget_color, timezone,
  active, trial_ends_at, wa_phone_number_id, wa_access_token,
  avg_job_value, workspace_type, agency_id, created_at
)
SELECT
  id, name, email, phone, website, industry, plan,
  stripe_customer_id, stripe_subscription_id,
  ai_personality, system_prompt, knowledge_base, services,
  booking_url, google_review_link, widget_color, timezone,
  active, trial_ends_at, wa_phone_number_id, wa_access_token,
  avg_job_value, workspace_type, agency_id, created_at
FROM businesses
ON CONFLICT (id) DO NOTHING;

-- Generate slugs from names
UPDATE businesses
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL;

-- ============================================
-- STEP 4: Create org_members for existing users
-- Map each business email to the auth.users table
-- ============================================

INSERT INTO org_members (org_id, user_id, role)
SELECT o.id, u.id, 'owner'
FROM businesses o
JOIN auth.users u ON u.email = o.email
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Set owner_id on businesses
UPDATE businesses o
SET owner_id = u.id
FROM auth.users u
WHERE u.email = o.email AND o.owner_id IS NULL;

-- ============================================
-- STEP 5: Add org_id column to all child tables
-- (keeping business_id for backwards compat during transition)
-- ============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE gdpr_consents ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE gdpr_audit_log ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- ============================================
-- STEP 6: Backfill org_id from business_id
-- (business_id = businesses.id since we preserved IDs)
-- ============================================

UPDATE leads SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;
UPDATE conversations SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;
UPDATE appointments SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;
UPDATE reviews SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;
UPDATE follow_ups SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;
UPDATE gdpr_consents SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;
UPDATE gdpr_audit_log SET org_id = business_id WHERE org_id IS NULL AND business_id IS NOT NULL;

-- ============================================
-- STEP 7: Indexes on org_id
-- ============================================

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_reviews_org ON reviews(org_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_org ON follow_ups(org_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_org ON gdpr_consents(org_id);
CREATE INDEX IF NOT EXISTS idx_prospects_org ON prospects(org_id);

-- ============================================
-- STEP 8: RLS on new tables
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Businesss: users can see/update their own orgs via org_members
CREATE POLICY "org_select" ON businesses FOR SELECT USING (
  id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "org_update" ON businesses FOR UPDATE USING (
  id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "org_insert" ON businesses FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);

-- Org members: users can see members of their own orgs
CREATE POLICY "org_members_select" ON org_members FOR SELECT USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "org_members_insert" ON org_members FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- ============================================
-- STEP 9: New RLS policies using org_id
-- (Drop old business_id-based policies, create org_id-based ones)
-- ============================================

-- Leads
DROP POLICY IF EXISTS "own_leads" ON leads;
CREATE POLICY "org_leads" ON leads FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- Conversations
DROP POLICY IF EXISTS "own_conversations" ON conversations;
CREATE POLICY "org_conversations" ON conversations FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- Appointments
DROP POLICY IF EXISTS "own_appointments" ON appointments;
CREATE POLICY "org_appointments" ON appointments FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- Reviews
DROP POLICY IF EXISTS "own_reviews" ON reviews;
CREATE POLICY "org_reviews" ON reviews FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- Follow-ups
DROP POLICY IF EXISTS "own_followups" ON follow_ups;
CREATE POLICY "org_followups" ON follow_ups FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- GDPR consents (keep service_role access too)
CREATE POLICY "org_gdpr_consents" ON gdpr_consents FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  OR auth.role() = 'service_role'
);

-- ============================================
-- STEP 10: Activity log table (new)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  description TEXT,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(org_id);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_activity_log" ON activity_log FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  OR auth.role() = 'service_role'
);
