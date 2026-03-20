-- Stripe webhook event idempotency table
-- Prevents duplicate processing of webhook events
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Auto-cleanup: remove events older than 30 days (optional cron)
-- SELECT cron.schedule('cleanup-webhook-events', '0 3 * * *', $$
--   DELETE FROM stripe_webhook_events WHERE processed_at < NOW() - INTERVAL '30 days';
-- $$);
