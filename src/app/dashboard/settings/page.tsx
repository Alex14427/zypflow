'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivationSnapshot, formatActivationStatus } from '@/lib/activation-state';
import { DEFAULT_BRAND_COLOR, resolveBrandAssets } from '@/lib/brand-theme';
import { resolveCurrentBusiness } from '@/lib/current-business';
import { formatCurrencyGBP } from '@/lib/formatting';
import { supabase } from '@/lib/supabase';
import { businessSettingsSchema, whatsappConfigSchema } from '@/lib/validators';

interface Organisation {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  plan: string;
  booking_url: string;
  google_review_link: string;
  ai_personality: string;
  stripe_customer_id: string | null;
  wa_phone_number_id: string | null;
  wa_access_token: string | null;
  widget_color: string | null;
  settings: Record<string, unknown> | null;
}

interface AutomationStatus {
  followUps: { sentLast7Days: number; leadsInPipeline: number; status: string };
  reminders: { upcomingAppointments: number; remindersSent: number; status: string };
  reviews: { requestedLast7Days: number; completedLast7Days: number; status: string };
}

interface ActivationResponse {
  activation: ActivationSnapshot;
  launchReadiness: {
    score: number;
    status: 'not_ready' | 'almost_ready' | 'launch_ready';
    completedCount: number;
    totalCount: number;
    packName: string;
  };
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<Organisation | null>(null);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus | null>(null);
  const [activation, setActivation] = useState<ActivationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'profile' | 'billing' | 'widget' | 'integrations'>('profile');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [aiPersonality, setAiPersonality] = useState('warm and friendly');
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [logoUrl, setLogoUrl] = useState('');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');

  const brandPreview = useMemo(
    () => resolveBrandAssets({ brand_color: brandColor, logo_url: logoUrl }, brandColor),
    [brandColor, logoUrl]
  );

  const loadActivation = useCallback(async () => {
    const response = await fetch('/api/activation', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setActivation(payload as ActivationResponse);
    }
  }, []);

  const syncActivation = useCallback(async (options?: { confirmWidgetInstalled?: boolean; forceWidgetCheck?: boolean }) => {
    const response = await fetch('/api/activation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setActivation(payload as ActivationResponse);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { business: currentBusiness } = await resolveCurrentBusiness();
        const { data } = await supabase
          .from('businesses')
          .select('id, name, email, phone, website, plan, booking_url, google_review_link, ai_personality, stripe_customer_id, wa_phone_number_id, wa_access_token, widget_color, settings')
          .eq('id', currentBusiness.id)
          .maybeSingle();

        if (data) {
          const organisation = data as Organisation;
          setBusiness(organisation);
          setName(organisation.name || '');
          setPhone(organisation.phone || '');
          setWebsite(organisation.website || '');
          setBookingUrl(organisation.booking_url || '');
          setGoogleReviewLink(organisation.google_review_link || '');
          setAiPersonality(organisation.ai_personality || 'warm and friendly');
          setBrandColor(typeof organisation.settings?.brand_color === 'string' ? organisation.settings.brand_color : organisation.widget_color || DEFAULT_BRAND_COLOR);
          setLogoUrl(typeof organisation.settings?.logo_url === 'string' ? organisation.settings.logo_url : '');
          setWaPhoneNumberId(organisation.wa_phone_number_id || '');
          setWaAccessToken(organisation.wa_access_token || '');

          fetch(`/api/automations/status?orgId=${organisation.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((payload) => payload?.followUps && setAutomationStatus(payload))
            .catch(() => {});
        }

        await loadActivation();
      } finally {
        setLoading(false);
      }
    }

    load().catch((error) => {
      console.error(error);
      setMessage('Unable to load settings.');
      setLoading(false);
    });
  }, [loadActivation]);

  async function saveProfile() {
    if (!business) return;
    const parsed = businessSettingsSchema.safeParse({
      name,
      phone,
      website,
      bookingUrl,
      googleReviewLink,
      aiPersonality,
      brandColor,
      logoUrl,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    setSaving(true);
    setMessage('');
    const nextSettings = { ...(business.settings || {}), brand_color: parsed.data.brandColor, logo_url: parsed.data.logoUrl || null };

    const { error } = await supabase.from('businesses').update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      website: parsed.data.website,
      booking_url: parsed.data.bookingUrl,
      google_review_link: parsed.data.googleReviewLink,
      ai_personality: parsed.data.aiPersonality,
      widget_color: parsed.data.brandColor,
      settings: nextSettings,
    }).eq('id', business.id);

    if (error) {
      setSaving(false);
      setMessage(error.message || 'Unable to save clinic settings.');
      return;
    }

    setBusiness({ ...business, name: parsed.data.name, phone: parsed.data.phone, website: parsed.data.website, booking_url: parsed.data.bookingUrl, google_review_link: parsed.data.googleReviewLink, ai_personality: parsed.data.aiPersonality, widget_color: parsed.data.brandColor, settings: nextSettings });
    await syncActivation();
    setSaving(false);
    setMessage('Clinic settings saved.');
  }

  async function saveWhatsapp() {
    if (!business) return;
    const parsed = whatsappConfigSchema.safeParse({ phoneNumberId: waPhoneNumberId, accessToken: waAccessToken });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Please check the WhatsApp credentials.');
      return;
    }
    const { error } = await supabase.from('businesses').update({
      wa_phone_number_id: parsed.data.phoneNumberId || null,
      wa_access_token: parsed.data.accessToken || null,
    }).eq('id', business.id);
    if (error) {
      setMessage(error.message || 'Unable to save WhatsApp config.');
      return;
    }
    setBusiness({ ...business, wa_phone_number_id: parsed.data.phoneNumberId || null, wa_access_token: parsed.data.accessToken || null });
    setMessage('WhatsApp config saved.');
  }

  async function startCheckout() {
    setBillingLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'starter', orgId: business?.id, email: business?.email }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Unable to start checkout.');
      window.location.href = payload.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Unable to open billing portal.');
      window.location.href = payload.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open billing portal.');
    } finally {
      setBillingLoading(false);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" /></div>;
  }

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com'}/v1.js" data-org-id="${business?.id}"></script>`;

  return (
    <div className="space-y-6" style={brandPreview.cssVariables}>
      <header className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="page-eyebrow">Clinic controls</span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">Brand, billing, widget, and integration controls in one place.</h1>
        </div>
        <div className="surface-panel rounded-[32px] p-5">
          <p className="page-eyebrow">Clinic preview</p>
          <div className="mt-4 flex items-center gap-4 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] p-4">
            {brandPreview.logoUrl ? <img src={brandPreview.logoUrl} alt="Clinic logo" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brandPreview.brandColor }}>{(name || 'Z').charAt(0).toUpperCase()}</div>}
            <div>
              <p className="text-sm font-semibold text-[var(--app-text)]">{name || 'Your clinic'}</p>
              <p className="text-xs text-[var(--app-text-muted)]">{brandPreview.brandColor} - {formatPlanLabel(business?.plan)}</p>
            </div>
          </div>
        </div>
      </header>

      {activation && (
        <section className="surface-panel rounded-[32px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="page-eyebrow">Launch status</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--app-text)]">{formatActivationStatus(activation.activation.status)}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge label={`${activation.activation.score}% synced`} tone="brand" />
              <Badge label={activation.activation.widgetInstalled ? 'Widget ready' : 'Widget pending'} tone={activation.activation.widgetInstalled ? 'good' : 'warn'} />
              <Badge label={activation.activation.billingReady ? 'Billing active' : 'Awaiting payment'} tone={activation.activation.billingReady ? 'good' : 'muted'} />
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--app-text-muted)]">{activation.launchReadiness.packName} is {activation.activation.packDeployed ? 'deployed' : 'not deployed yet'}.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => syncActivation({ forceWidgetCheck: tab === 'widget' })} className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white">Run activation check</button>
            <span className="text-sm text-[var(--app-text-muted)]">{activation.launchReadiness.completedCount}/{activation.launchReadiness.totalCount} launch steps complete</span>
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-1">
        {(['profile', 'billing', 'widget', 'integrations'] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2.5 text-sm font-semibold capitalize ${tab === item ? 'bg-brand-purple text-white' : 'text-[var(--app-text-muted)]'}`}>{item}</button>
        ))}
      </section>

      {tab === 'profile' && (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="surface-panel rounded-[32px] p-6 space-y-4">
            <Field label="Clinic name" value={name} onChange={setName} />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Website" value={website} onChange={setWebsite} />
            <Field label="Booking URL" value={bookingUrl} onChange={setBookingUrl} />
            <Field label="Google review link" value={googleReviewLink} onChange={setGoogleReviewLink} />
            <Field label="AI personality" value={aiPersonality} onChange={setAiPersonality} />
          </div>
          <div className="surface-panel rounded-[32px] p-6 space-y-4">
            <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} />
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">Brand color</label>
              <div className="flex items-center gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2">
                <input type="color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} className="h-10 w-12 bg-transparent" />
                <input type="text" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} className="flex-1 bg-transparent text-sm text-[var(--app-text)] outline-none" />
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white">{saving ? 'Saving...' : 'Save clinic settings'}</button>
          </div>
        </section>
      )}

      {tab === 'billing' && (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="surface-panel rounded-[32px] p-6">
            <p className="page-eyebrow">Managed pilot terms</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricTile label="Pilot fee" value={`${formatCurrencyGBP(995)}/mo`} />
              <MetricTile label="Setup fee" value={formatCurrencyGBP(495)} />
              <MetricTile label="Term" value="60 days" />
              <MetricTile label="Scope" value="1 clinic, 1 pack" />
            </div>
          </div>
          <div className="surface-panel rounded-[32px] p-6">
            <p className="page-eyebrow">Billing controls</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {business?.stripe_customer_id ? (
                <button onClick={openBillingPortal} disabled={billingLoading} className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white">{billingLoading ? 'Opening...' : 'Open billing portal'}</button>
              ) : (
                <button onClick={startCheckout} disabled={billingLoading} className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white">{billingLoading ? 'Starting...' : 'Activate approved clinic'}</button>
              )}
            </div>
            <p className="mt-4 text-sm text-[var(--app-text-muted)]">{business?.email}</p>
          </div>
        </section>
      )}

      {tab === 'widget' && (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="surface-panel rounded-[32px] p-6">
            <p className="page-eyebrow">Install code</p>
            <div className="mt-4 overflow-x-auto rounded-[24px] bg-slate-950 p-4 font-mono text-sm text-emerald-300">{embedCode}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => navigator.clipboard.writeText(embedCode)} className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white">Copy install code</button>
              <button onClick={() => syncActivation({ forceWidgetCheck: true })} className="rounded-full border border-[var(--app-border)] px-5 py-3 text-sm font-semibold text-[var(--app-text)]">Verify widget</button>
            </div>
          </div>
          <div className="surface-panel rounded-[32px] p-6">
            <p className="page-eyebrow">Platform notes</p>
            <div className="mt-4 space-y-3 text-sm text-[var(--app-text-muted)]">
              <p>WordPress - Insert Headers and Footers - Footer.</p>
              <p>Wix - Settings - Custom Code - Body End.</p>
              <p>Squarespace - Settings - Advanced - Code Injection - Footer.</p>
            </div>
          </div>
        </section>
      )}

      {tab === 'integrations' && (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="surface-panel rounded-[32px] p-6 space-y-4">
            <Field label="WhatsApp Phone Number ID" value={waPhoneNumberId} onChange={setWaPhoneNumberId} />
            <Field label="WhatsApp Access Token" value={waAccessToken} onChange={setWaAccessToken} />
            <button onClick={saveWhatsapp} className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white">Save WhatsApp config</button>
          </div>
          <div className="space-y-4">
            {automationStatus && (
              <div className="surface-panel rounded-[32px] p-6">
                <p className="page-eyebrow">Automation health</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricTile label="Follow-ups" value={`${automationStatus.followUps.sentLast7Days}`} />
                  <MetricTile label="Reminders" value={`${automationStatus.reminders.remindersSent}`} />
                  <MetricTile label="Reviews" value={`${automationStatus.reviews.completedLast7Days}`} />
                </div>
              </div>
            )}
            <div className="surface-panel rounded-[32px] p-6 text-sm text-[var(--app-text-muted)]">
              Stripe, Twilio, Resend, Sentry, and workflow jobs are all surfaced here so the clinic setup stays commercially clean.
            </div>
          </div>
        </section>
      )}

      {message && <p className="text-sm text-[var(--app-text-muted)]">{message}</p>}
    </div>
  );
}

function formatPlanLabel(plan: string | null | undefined) {
  if (!plan || plan === 'trial') {
    return 'Founding setup';
  }

  return plan.replace(/_/g, ' ');
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm text-[var(--app-text)] outline-none" />
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4"><p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p><p className="mt-2 text-lg font-semibold text-[var(--app-text)]">{value}</p></div>;
}

function Badge({ label, tone }: { label: string; tone: 'brand' | 'good' | 'warn' | 'muted' }) {
  const styles = {
    brand: 'bg-brand-purple text-white',
    good: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200',
    warn: 'bg-amber-500/15 text-amber-600 dark:text-amber-200',
    muted: 'bg-slate-500/12 text-[var(--app-text-muted)]',
  };
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${styles[tone]}`}>{label}</span>;
}
