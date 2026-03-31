'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Organisation {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  plan: string;
  booking_url: string;
  google_review_link: string;
  ai_personality: string;
  stripe_customer_id: string | null;
  wa_phone_number_id: string | null;
  wa_access_token: string | null;
}

interface AutomationStatus {
  followUps: { sentLast7Days: number; leadsInPipeline: number; status: string };
  reminders: { upcomingAppointments: number; remindersSent: number; status: string };
  reviews: { requestedLast7Days: number; completedLast7Days: number; avgRating: number; status: string };
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'business' | 'billing' | 'widget' | 'integrations'>('business');
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [aiPersonality, setAiPersonality] = useState('');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waSaving, setWaSaving] = useState(false);
  const [waSaved, setWaSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('businesses')
        .select('id, name, email, phone, website, industry, plan, booking_url, google_review_link, ai_personality, stripe_customer_id, wa_phone_number_id, wa_access_token')
        .eq('email', user.email)
        .maybeSingle();
      if (data) {
        setBusiness(data as Organisation);
        setName(data.name || '');
        setPhone(data.phone || '');
        setWebsite(data.website || '');
        setBookingUrl(data.booking_url || '');
        setGoogleReviewLink(data.google_review_link || '');
        setAiPersonality(data.ai_personality || 'warm and friendly');
        setWaPhoneNumberId(data.wa_phone_number_id || '');
        setWaAccessToken(data.wa_access_token || '');

        // Fetch automation health status
        fetch(`/api/automations/status?orgId=${data.id}`)
          .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
          .then(d => { if (d.followUps) setAutomationStatus(d); })
          .catch(() => {});
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    await supabase.from('businesses').update({
      name, phone, website, booking_url: bookingUrl,
      google_review_link: googleReviewLink, ai_personality: aiPersonality,
    }).eq('id', business.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function openBillingPortal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com'}/v1.js" data-org-id="${business?.id}"></script>`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {(['business', 'billing', 'widget', 'integrations'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
              tab === t ? 'bg-white shadow text-brand-purple' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Business info */}
      {tab === 'business' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
          <h2 className="font-semibold mb-4">Business Information</h2>
          <div className="space-y-4">
            <Field label="Business Name" value={name} onChange={setName} />
            <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+44 7700 900000" />
            <Field label="Website" value={website} onChange={setWebsite} placeholder="https://www.example.com" />
            <Field label="Booking URL" value={bookingUrl} onChange={setBookingUrl} placeholder="https://calendly.com/..." />
            <Field label="Google Review Link" value={googleReviewLink} onChange={setGoogleReviewLink} placeholder="https://g.page/r/..." />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Personality</label>
              <select
                value={aiPersonality}
                onChange={e => setAiPersonality(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              >
                <option value="warm and friendly">Warm and friendly</option>
                <option value="professional and formal">Professional and formal</option>
                <option value="casual and approachable">Casual and approachable</option>
                <option value="luxury and sophisticated">Luxury and sophisticated</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-purple text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-purple-dark transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span className="text-green-600 text-sm">Saved!</span>}
            </div>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'billing' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
          <h2 className="font-semibold mb-4">Billing & Subscription</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-gray-500">You are on the <span className="font-semibold uppercase text-brand-purple">{business?.plan}</span> plan.</p>
              </div>
              <span className="bg-brand-purple text-white text-xs px-3 py-1 rounded-full uppercase font-semibold">
                {business?.plan}
              </span>
            </div>

            {business?.stripe_customer_id ? (
              <button
                onClick={openBillingPortal}
                className="bg-brand-purple text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-purple-dark transition"
              >
                Manage Subscription
              </button>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">Upgrade to a paid plan to unlock all features.</p>
                <a
                  href="/pricing"
                  className="inline-block bg-brand-purple text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-purple-dark transition"
                >
                  View Plans
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Widget */}
      {tab === 'widget' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
          <h2 className="font-semibold mb-4">Chat Widget</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add this code to your website, just before the closing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono break-all mb-4">
            {embedCode}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className="bg-brand-purple text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-brand-purple-dark transition"
          >
            Copy to Clipboard
          </button>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
            <p><strong>WordPress:</strong> &quot;Insert Headers and Footers&quot; plugin &rarr; paste in Footer</p>
            <p><strong>Wix:</strong> Settings &rarr; Custom Code &rarr; Body End</p>
            <p><strong>Squarespace:</strong> Settings &rarr; Advanced &rarr; Code Injection &rarr; Footer</p>
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <div className="space-y-4 max-w-2xl">
          {/* Automation Health Panel */}
          {automationStatus && (
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-2">
              <h2 className="font-semibold mb-4">Automation Health</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AutomationStatusCard
                  label="Follow-ups"
                  status={automationStatus.followUps.status}
                  detail={`${automationStatus.followUps.sentLast7Days} sent (7d) · ${automationStatus.followUps.leadsInPipeline} in pipeline`}
                />
                <AutomationStatusCard
                  label="Reminders"
                  status={automationStatus.reminders.status}
                  detail={`${automationStatus.reminders.upcomingAppointments} upcoming · ${automationStatus.reminders.remindersSent} reminded`}
                />
                <AutomationStatusCard
                  label="Reviews"
                  status={automationStatus.reviews.status}
                  detail={`${automationStatus.reviews.requestedLast7Days} requested (7d) · ${automationStatus.reviews.completedLast7Days} completed`}
                />
              </div>
            </div>
          )}

          {/* WhatsApp Connect */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">WhatsApp Business</h3>
                <span className={`w-2 h-2 rounded-full ${business?.wa_phone_number_id ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                business?.wa_phone_number_id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {business?.wa_phone_number_id ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Send automated WhatsApp messages to leads. Get credentials from your Meta Business Suite.</p>
            <div className="space-y-3">
              <Field label="Phone Number ID" value={waPhoneNumberId} onChange={setWaPhoneNumberId} placeholder="e.g. 100234567890" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                <input
                  type="password"
                  value={waAccessToken}
                  onChange={e => setWaAccessToken(e.target.value)}
                  placeholder="Your permanent access token"
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!business) return;
                    setWaSaving(true);
                    await supabase.from('businesses').update({
                      wa_phone_number_id: waPhoneNumberId || null,
                      wa_access_token: waAccessToken || null,
                    }).eq('id', business.id);
                    setWaSaving(false);
                    setWaSaved(true);
                    setTimeout(() => setWaSaved(false), 2000);
                  }}
                  disabled={waSaving}
                  className="bg-brand-purple text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-purple-dark transition disabled:opacity-50"
                >
                  {waSaving ? 'Saving...' : 'Save WhatsApp Config'}
                </button>
                {waSaved && <span className="text-green-600 text-sm">Saved!</span>}
              </div>
            </div>
          </div>

          <IntegrationCard
            name="Stripe"
            description="Payment processing for subscriptions"
            connected={!!business?.stripe_customer_id}
          />
          <IntegrationCard
            name="Twilio"
            description="SMS messaging for reminders and follow-ups"
            connected={true}
            details="SMS & appointment reminders active"
          />
          <IntegrationCard
            name="Resend"
            description="Transactional email delivery"
            connected={true}
            details="Email notifications active"
          />
          <IntegrationCard
            name="Cal.com"
            description="Online booking system"
            connected={!!bookingUrl}
            details={bookingUrl || 'Add your booking URL above'}
          />
          <IntegrationCard
            name="PostHog"
            description="Product analytics"
            connected={true}
          />
          <IntegrationCard
            name="Sentry"
            description="Error tracking and monitoring"
            connected={true}
          />
          <IntegrationCard
            name="Make.com"
            description="Automation workflows (lead notifications, reminders, follow-ups)"
            connected={true}
            details="3 active scenarios"
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
      />
    </div>
  );
}

function AutomationStatusCard({ label, status, detail }: {
  label: string; status: string; detail: string;
}) {
  const statusConfig: Record<string, { color: string; text: string }> = {
    healthy: { color: 'bg-green-100 text-green-700', text: 'Healthy' },
    warning: { color: 'bg-yellow-100 text-yellow-700', text: 'Needs attention' },
    idle: { color: 'bg-gray-100 text-gray-500', text: 'Idle' },
  };
  const cfg = statusConfig[status] || statusConfig.idle;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{label}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.text}</span>
      </div>
      <p className="text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function IntegrationCard({ name, description, connected, details }: {
  name: string; description: string; connected: boolean; details?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{name}</h3>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
        </div>
        <p className="text-sm text-gray-500">{description}</p>
        {details && <p className="text-xs text-gray-400 mt-1">{details}</p>}
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {connected ? 'Connected' : 'Not connected'}
      </span>
    </div>
  );
}
