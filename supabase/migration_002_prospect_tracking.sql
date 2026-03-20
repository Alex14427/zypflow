-- =============================================
-- MIGRATION 002: Prospect tracking columns
-- Adds response tracking for Instantly.ai webhook
-- Run in Supabase SQL Editor
-- =============================================

-- Add tracking columns to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Add index for prospect status filtering
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);

-- Allow the leads table to accept rows without business_id for cold outreach leads
-- (outreach webhook creates leads from prospect replies, not tied to a specific business)
ALTER TABLE leads ALTER COLUMN business_id DROP NOT NULL;

-- Website enquiries table for landing page lead capture form
-- Separate from customer leads (which require business_id)
CREATE TABLE IF NOT EXISTS website_enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  phone TEXT,
  source TEXT DEFAULT 'website_audit_form',
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_enquiries_email ON website_enquiries(email);
CREATE INDEX IF NOT EXISTS idx_website_enquiries_status ON website_enquiries(status);
