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
