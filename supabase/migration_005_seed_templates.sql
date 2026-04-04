-- Migration 005: Seed workflow templates with actions_json
-- Also creates deployed_templates table to track active templates per org

-- Track which templates are deployed for each org
CREATE TABLE IF NOT EXISTS deployed_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES workflow_templates(id),
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  deployed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_deployed_templates_org ON deployed_templates(org_id);
ALTER TABLE deployed_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_deployed_templates" ON deployed_templates FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- Seed the 18 workflow templates
INSERT INTO workflow_templates (id, name, industry, description, trigger_type, actions_json, featured, setup_minutes, icon, minutes_saved_per_run) VALUES

-- GENERAL TEMPLATES
('new-lead-follow-up', 'New Lead Auto Follow-Up', 'general',
 'Automatically send a personalised follow-up email when a new lead comes in via the chat widget. Includes a booking link and service summary.',
 'new_lead',
 '[{"type":"delay","minutes":2},{"type":"send_email","subject":"Thanks for getting in touch, {{lead_name}}!","body":"Hi {{lead_name}},\n\nThanks for chatting with us! Based on your interest in {{service_interest}}, I wanted to follow up personally.\n\nYou can book a time that suits you here: {{booking_url}}\n\nLooking forward to helping you.\n\nBest,\n{{org_name}}","channel":"email"},{"type":"send_sms","body":"Hi {{lead_name}}, thanks for your enquiry! Book your appointment here: {{booking_url}} - {{org_name}}"},{"type":"update_lead","status":"contacted"}]'::jsonb,
 true, 5, 'mail', 15),

('appointment-reminders', 'Appointment Reminder Sequence', 'general',
 'Send SMS and email reminders at 48h, 24h, and 2h before appointments. Reduces no-shows by up to 40%.',
 'appointment_created',
 '[{"type":"schedule_reminder","before_minutes":2880,"channel":"email","subject":"Appointment reminder - {{service}}","body":"Hi {{lead_name}},\n\nJust a friendly reminder that your {{service}} appointment is in 2 days on {{appointment_date}} at {{appointment_time}}.\n\nSee you then!\n{{org_name}}"},{"type":"schedule_reminder","before_minutes":1440,"channel":"sms","body":"Reminder: Your {{service}} appointment is tomorrow at {{appointment_time}}. Reply CHANGE to reschedule. - {{org_name}}"},{"type":"schedule_reminder","before_minutes":120,"channel":"sms","body":"Your {{service}} appointment is in 2 hours at {{appointment_time}}. See you soon! - {{org_name}}"}]'::jsonb,
 true, 5, 'bell', 10),

('review-request', 'Post-Appointment Review Request', 'general',
 'Automatically ask happy customers for a Google review 2 hours after their appointment. Includes direct link to your Google review page.',
 'appointment_completed',
 '[{"type":"delay","minutes":120},{"type":"send_sms","body":"Hi {{lead_name}}, thank you for visiting {{org_name}} today! If you had a great experience, we''d really appreciate a quick review: {{google_review_link}} - it helps other people find us!"},{"type":"send_email","subject":"How was your visit to {{org_name}}?","body":"Hi {{lead_name}},\n\nThank you for visiting us today. We hope you had a great experience!\n\nIf you have a moment, leaving us a Google review would mean the world:\n{{google_review_link}}\n\nThank you!\n{{org_name}}"}]'::jsonb,
 true, 3, 'star', 8),

('lead-scoring-alert', 'Hot Lead Alert', 'general',
 'Get an instant SMS or email notification when a lead scores 70+ so you can follow up personally while they''re still interested.',
 'lead_score_update',
 '[{"type":"condition","field":"lead_score","operator":"gte","value":70},{"type":"send_email","to":"{{org_email}}","subject":"Hot Lead Alert: {{lead_name}} scored {{lead_score}}","body":"A new hot lead just came in!\n\nName: {{lead_name}}\nEmail: {{lead_email}}\nPhone: {{lead_phone}}\nScore: {{lead_score}}\nInterested in: {{service_interest}}\n\nFollow up NOW while they''re still interested."},{"type":"send_sms","to":"{{org_phone}}","body":"HOT LEAD: {{lead_name}} scored {{lead_score}}. Call them now! {{lead_phone}} - Zypflow"}]'::jsonb,
 false, 3, 'flame', 5),

('win-back-campaign', 'Win-Back Campaign', 'general',
 'Re-engage leads who haven''t responded in 14 days with a personalised offer or check-in message.',
 'lead_inactive',
 '[{"type":"condition","field":"days_inactive","operator":"gte","value":14},{"type":"send_email","subject":"Still interested, {{lead_name}}?","body":"Hi {{lead_name}},\n\nWe noticed you enquired about {{service_interest}} a couple of weeks ago. Just checking in to see if you still need help?\n\nWe''d love to help you out. Book a quick call here: {{booking_url}}\n\nBest,\n{{org_name}}"},{"type":"delay","minutes":4320},{"type":"send_sms","body":"Hi {{lead_name}}, just a quick follow-up from {{org_name}}. Still looking for help with {{service_interest}}? Book here: {{booking_url}}"}]'::jsonb,
 false, 10, 'refresh', 20),

('weekly-report', 'Weekly Performance Report', 'general',
 'Receive a weekly email summary of new leads, bookings, conversations, and revenue — delivered every Monday morning.',
 'scheduled',
 '[{"type":"generate_report","metrics":["new_leads","total_conversations","appointments_booked","reviews_received","conversion_rate"],"period":"7d"},{"type":"send_email","to":"{{org_email}}","subject":"Your Weekly Zypflow Report - {{report_date}}","body":"{{generated_report}}"}]'::jsonb,
 false, 5, 'chart', 15),

-- DENTAL
('dental-new-patient', 'New Patient Welcome', 'dental',
 'Welcome new dental patients with registration forms, practice info, and pre-appointment instructions. Includes parking and what to bring.',
 'new_lead',
 '[{"type":"delay","minutes":5},{"type":"send_email","subject":"Welcome to {{org_name}} - Your First Visit","body":"Dear {{lead_name}},\n\nWelcome to {{org_name}}! We''re looking forward to meeting you.\n\nBefore your first visit, please:\n- Bring a valid photo ID\n- Arrive 10 minutes early for paperwork\n- Note any medications you''re currently taking\n\nOur address: Check our website for directions and parking info.\n\nBook your appointment: {{booking_url}}\n\nSee you soon!\n{{org_name}}"},{"type":"update_lead","status":"contacted"}]'::jsonb,
 true, 10, 'heart', 20),

('dental-recall', '6-Month Check-Up Recall', 'dental',
 'Automatically remind patients when their 6-month check-up is due. Sends SMS with a direct booking link.',
 'scheduled',
 '[{"type":"query_appointments","filter":"completed","older_than_days":180},{"type":"send_sms","body":"Hi {{lead_name}}, it''s been 6 months since your last check-up at {{org_name}}. Time for your next visit! Book here: {{booking_url}}"},{"type":"send_email","subject":"Time for your 6-month check-up, {{lead_name}}","body":"Hi {{lead_name}},\n\nIt''s been 6 months since your last dental check-up. Regular check-ups help catch problems early and keep your smile healthy.\n\nBook your next appointment: {{booking_url}}\n\nBest,\n{{org_name}}"}]'::jsonb,
 false, 5, 'calendar', 10),

('dental-treatment-follow-up', 'Post-Treatment Care', 'dental',
 'Send aftercare instructions via SMS after procedures like extractions, fillings, or whitening. Reduces post-op call volume.',
 'appointment_completed',
 '[{"type":"delay","minutes":60},{"type":"send_sms","body":"Hi {{lead_name}}, thank you for visiting {{org_name}} today. Here are your aftercare tips:\n\n- Avoid hot food/drinks for 2 hours\n- Take any prescribed medication as directed\n- Contact us if you experience unusual pain\n\nCall us on {{org_phone}} if you have any concerns."}]'::jsonb,
 false, 8, 'shield', 12),

-- AESTHETICS
('aesthetics-consultation', 'Consultation Booking Flow', 'aesthetics',
 'When a lead enquires about treatments, send a personalised consultation booking link with treatment info and pricing.',
 'new_lead',
 '[{"type":"delay","minutes":3},{"type":"send_email","subject":"Your {{service_interest}} consultation at {{org_name}}","body":"Hi {{lead_name}},\n\nThank you for your interest in {{service_interest}} at {{org_name}}.\n\nWe offer a complimentary consultation where we''ll discuss your goals, explain the treatment process, and create a personalised plan.\n\nBook your consultation: {{booking_url}}\n\nWe look forward to meeting you!\n{{org_name}}"},{"type":"update_lead","status":"contacted"}]'::jsonb,
 true, 8, 'sparkles', 15),

('aesthetics-aftercare', 'Treatment Aftercare Sequence', 'aesthetics',
 'Send tailored aftercare instructions for Botox, fillers, skin treatments etc. Includes do''s, don''ts, and when to expect results.',
 'appointment_completed',
 '[{"type":"delay","minutes":30},{"type":"send_email","subject":"Your aftercare instructions from {{org_name}}","body":"Hi {{lead_name}},\n\nThank you for your treatment today! Here are your aftercare instructions:\n\nDO:\n- Apply a cold compress if needed\n- Stay hydrated\n- Sleep elevated tonight\n\nDON''T:\n- Touch or rub the treated area for 4 hours\n- Exercise vigorously for 24 hours\n- Apply makeup for 12 hours\n\nResults typically appear within 3-7 days.\n\nAny concerns? Call us on {{org_phone}}.\n\n{{org_name}}"}]'::jsonb,
 false, 10, 'heart', 12),

('aesthetics-rebooking', 'Treatment Top-Up Reminder', 'aesthetics',
 'Remind clients when their treatment results will start to fade (e.g. Botox at 3 months, filler at 9 months) with a rebooking link.',
 'scheduled',
 '[{"type":"query_appointments","filter":"completed","older_than_days":90},{"type":"send_sms","body":"Hi {{lead_name}}, it''s been about 3 months since your last treatment at {{org_name}}. Ready for a top-up? Book here: {{booking_url}}"},{"type":"send_email","subject":"Time for your treatment top-up, {{lead_name}}?","body":"Hi {{lead_name}},\n\nIt''s been a while since your last visit. Most treatments benefit from regular maintenance to keep results looking their best.\n\nBook your next appointment: {{booking_url}}\n\nBest,\n{{org_name}}"}]'::jsonb,
 false, 8, 'refresh', 10),

-- LEGAL
('legal-intake', 'Client Intake Automation', 'legal',
 'Collect case details, send engagement letters, and schedule initial consultations automatically when new enquiries come in.',
 'new_lead',
 '[{"type":"delay","minutes":5},{"type":"send_email","subject":"Thank you for contacting {{org_name}}","body":"Dear {{lead_name}},\n\nThank you for contacting {{org_name}} regarding {{service_interest}}.\n\nTo help us understand your situation, please:\n\n1. Book an initial consultation: {{booking_url}}\n2. Prepare a brief summary of your matter\n3. Gather any relevant documents\n\nOur initial consultation is confidential and without obligation.\n\nKind regards,\n{{org_name}}"},{"type":"update_lead","status":"contacted"}]'::jsonb,
 true, 15, 'briefcase', 30),

('legal-case-update', 'Case Progress Update', 'legal',
 'Send automated case status updates to clients at key milestones. Reduces "where''s my case?" phone calls.',
 'manual',
 '[{"type":"send_email","subject":"Case Update - {{org_name}}","body":"Dear {{lead_name}},\n\nWe are writing to update you on the progress of your matter.\n\n{{custom_message}}\n\nIf you have any questions, please do not hesitate to contact us.\n\nKind regards,\n{{org_name}}"}]'::jsonb,
 false, 10, 'file-text', 15),

-- HOME SERVICES
('home-quote-follow-up', 'Quote Follow-Up', 'home_services',
 'Automatically follow up with customers 24h and 72h after sending a quote. Includes a direct booking link to lock in the job.',
 'manual',
 '[{"type":"delay","minutes":1440},{"type":"send_sms","body":"Hi {{lead_name}}, just following up on the quote we sent for {{service_interest}}. Any questions? Book here to confirm: {{booking_url}} - {{org_name}}"},{"type":"delay","minutes":2880},{"type":"send_email","subject":"Your quote from {{org_name}}","body":"Hi {{lead_name}},\n\nJust checking in about the quote we provided for {{service_interest}}.\n\nWe''d love to get this booked in for you. Our diary fills up quickly, so if you''d like to go ahead, book here: {{booking_url}}\n\nAny questions? Just reply to this email.\n\nCheers,\n{{org_name}}"}]'::jsonb,
 true, 5, 'clipboard', 15),

('home-seasonal-reminder', 'Seasonal Service Reminder', 'home_services',
 'Remind past customers about seasonal services — boiler checks in autumn, gutter cleaning in spring, garden maintenance in summer.',
 'scheduled',
 '[{"type":"query_appointments","filter":"completed","older_than_days":180},{"type":"send_email","subject":"Seasonal reminder from {{org_name}}","body":"Hi {{lead_name}},\n\nJust a friendly reminder that it''s time for your seasonal service check.\n\nRegular maintenance helps avoid costly emergency repairs. Book your service here: {{booking_url}}\n\nCheers,\n{{org_name}}"}]'::jsonb,
 false, 10, 'sun', 20),

-- PHYSIOTHERAPY
('physio-exercise-plan', 'Exercise Plan Delivery', 'physiotherapy',
 'Send personalised exercise plans and recovery instructions after each physio session. Includes video links and progress tracking.',
 'appointment_completed',
 '[{"type":"delay","minutes":60},{"type":"send_email","subject":"Your exercise plan from {{org_name}}","body":"Hi {{lead_name}},\n\nGreat session today! Here''s your personalised exercise plan:\n\n{{custom_message}}\n\nRemember:\n- Do these exercises 2-3 times daily\n- Stop if you feel sharp pain\n- Ice the area for 15 mins after exercises\n\nYour next appointment: {{booking_url}}\n\nBest,\n{{org_name}}"}]'::jsonb,
 true, 10, 'activity', 15),

('physio-progress-check', 'Recovery Check-In', 'physiotherapy',
 'Send a follow-up message 3 days after treatment to check pain levels and recovery progress. Flags patients who need attention.',
 'appointment_completed',
 '[{"type":"delay","minutes":4320},{"type":"send_sms","body":"Hi {{lead_name}}, it''s {{org_name}}. How are you feeling 3 days after your session? Reply with your pain level 1-10 and we''ll adjust your plan if needed."}]'::jsonb,
 false, 5, 'thermometer', 10)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  actions_json = EXCLUDED.actions_json,
  featured = EXCLUDED.featured,
  setup_minutes = EXCLUDED.setup_minutes,
  icon = EXCLUDED.icon,
  minutes_saved_per_run = EXCLUDED.minutes_saved_per_run;
