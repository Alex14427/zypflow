-- =============================================
-- ZYPFLOW DATABASE SCHEMA v1.0
-- Run this entire block in Supabase SQL Editor
-- Project: quarijsqejzilervrcub
-- =============================================

-- 1. BUSINESSES (one row per paying customer)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Drop old leads table and recreate with business_id
-- (The old leads table from session 1 doesn't have business_id)
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'chat',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status TEXT DEFAULT 'new',
  service_interest TEXT,
  urgency TEXT DEFAULT 'medium',
  notes TEXT,
  last_contact_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CONVERSATIONS
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'chat',
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. APPOINTMENTS
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service TEXT,
  datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'confirmed',
  reminder_48h_sent BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  satisfaction_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. REVIEWS
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'google',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  reminder_sent BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- 6. FOLLOW_UPS
CREATE TABLE follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL,
  step_number INTEGER DEFAULT 1,
  channel TEXT DEFAULT 'sms',
  message_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false
);

-- 7. PROSPECTS (for outreach/scraping pipeline)
CREATE TABLE prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  business_name TEXT,
  website TEXT,
  industry TEXT,
  city TEXT,
  source TEXT DEFAULT 'apify_google_maps',
  instantly_campaign_id TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. INDEXES
CREATE INDEX idx_leads_business ON leads(business_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_datetime ON appointments(datetime);
CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_follow_ups_lead ON follow_ups(lead_id);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_industry_city ON prospects(industry, city);

-- 9. ROW LEVEL SECURITY
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES (each business only sees their own data)

-- Businesses: users can read/update their own business
CREATE POLICY "own_business_select" ON businesses FOR SELECT USING (
  email = auth.jwt() ->> 'email'
);
CREATE POLICY "own_business_update" ON businesses FOR UPDATE USING (
  email = auth.jwt() ->> 'email'
);
-- Allow anon insert for signup
CREATE POLICY "anon_business_insert" ON businesses FOR INSERT WITH CHECK (true);

-- Leads
CREATE POLICY "own_leads" ON leads FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE email = auth.jwt() ->> 'email')
);

-- Conversations
CREATE POLICY "own_conversations" ON conversations FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE email = auth.jwt() ->> 'email')
);

-- Appointments
CREATE POLICY "own_appointments" ON appointments FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE email = auth.jwt() ->> 'email')
);

-- Reviews
CREATE POLICY "own_reviews" ON reviews FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE email = auth.jwt() ->> 'email')
);

-- Follow-ups
CREATE POLICY "own_followups" ON follow_ups FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE email = auth.jwt() ->> 'email')
);

-- Prospects: only accessible via service_role (API routes), not from browser
CREATE POLICY "service_role_prospects" ON prospects FOR ALL USING (
  auth.role() = 'service_role'
);
