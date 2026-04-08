'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import { bookingLinksSchema, businessBasicsSchema } from '@/lib/validators';
import { useRouter } from 'next/navigation';

interface Service {
  name: string;
  price: string;
  duration_minutes: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const INDUSTRIES = ['Dental', 'Aesthetics', 'Physiotherapy', 'Legal', 'Home Services', 'Other'];
const ONBOARDING_STEPS = [
  { title: 'Business basics', description: 'Website, contact details, and clinic category.' },
  { title: 'Service menu', description: 'Core offers, pricing, and visit length.' },
  { title: 'Clinic FAQs', description: 'Knowledge the assistant should answer confidently.' },
  { title: 'Booking and reviews', description: 'Where leads should book and leave proof.' },
  { title: 'Assistant tone', description: 'How the AI should sound to patients.' },
  { title: 'Prompt review', description: 'The system brief that powers the assistant.' },
  { title: 'Widget install', description: 'Install the website script and confirm launch.' },
  { title: 'Go live', description: 'Review what happens next and open the dashboard.' },
] as const;
const PERSONALITIES = [
  { value: 'warm and friendly', label: 'Warm & Friendly', description: 'Approachable, reassuring, and easy for patients to trust.' },
  { value: 'professional and formal', label: 'Professional & Formal', description: 'Expert-led and polished, with strong trust signals.' },
  { value: 'casual and approachable', label: 'Casual & Approachable', description: 'Relaxed and conversational without feeling sloppy.' },
  { value: 'luxury and sophisticated', label: 'Luxury & Sophisticated', description: 'Premium, elevated, and suited to high-ticket aesthetics brands.' },
];
const INPUT_CLASS_NAME =
  'w-full rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-brand-purple/50 focus:ring-2 focus:ring-brand-purple/10 placeholder:text-[var(--app-text-soft)]';
const TEXTAREA_CLASS_NAME = `${INPUT_CLASS_NAME} min-h-[110px] resize-none`;
const PRIMARY_BUTTON_CLASS_NAME =
  'rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-50';
const SECONDARY_BUTTON_CLASS_NAME =
  'rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-muted)]';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const router = useRouter();

  // AI extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractionDone, setExtractionDone] = useState(false);

  // Screen 1 — Business basics
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('Dental');

  // Screen 2 — Services
  const [services, setServices] = useState<Service[]>([{ name: '', price: '', duration_minutes: '' }]);

  // Screen 3 — FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([{ question: '', answer: '' }]);

  // Screen 4 — Booking & reviews
  const [bookingUrl, setBookingUrl] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');

  // Screen 5 — AI personality
  const [personality, setPersonality] = useState('warm and friendly');
  const [extraNotes, setExtraNotes] = useState('');

  // Screen 6 — AI-generated prompt preview
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Restore saved step on mount
  useEffect(() => {
    const savedStep = localStorage.getItem('zyp-onboarding-step');
    if (savedStep) {
      const parsed = parseInt(savedStep, 10);
      if (parsed >= 1 && parsed <= 8) setStep(parsed);
    }
  }, []);

  // Persist step changes
  useEffect(() => {
    localStorage.setItem('zyp-onboarding-step', String(step));
  }, [step]);

  useEffect(() => {
    setFormError('');
    setStatusMessage('');
  }, [step]);

  // Fetch business ID on mount
  useEffect(() => {
    async function fetchBusiness() {
      try {
        const { business } = await resolveCurrentBusiness();

        setOrgId(business.id);
        if (business.name) setName(business.name);
        if (business.website) setWebsite(business.website);
        if (business.phone) setPhone(business.phone);
        if (business.industry) {
          const matchingIndustry =
            INDUSTRIES.find((option) => option.toLowerCase() === business.industry?.toLowerCase()) || business.industry;
          setIndustry(matchingIndustry);
        }
        if (business.booking_url) setBookingUrl(business.booking_url);
        if (business.google_review_link) setGoogleReviewLink(business.google_review_link);
        if (business.ai_personality) setPersonality(business.ai_personality);
        if (business.system_prompt) setGeneratedPrompt(business.system_prompt);
        if (Array.isArray(business.services) && business.services.length > 0) {
          setServices(
            business.services.map((service) => {
              const item = service as Partial<Service>;
              return {
                name: item.name || '',
                price: item.price || '',
                duration_minutes: item.duration_minutes || '',
              };
            })
          );
        }
        if (Array.isArray(business.knowledge_base) && business.knowledge_base.length > 0) {
          setFaqs(
            business.knowledge_base.map((faq) => {
              const item = faq as Partial<FAQ>;
              return {
                question: item.question || '',
                answer: item.answer || '',
              };
            })
          );
        }
      } catch (err) {
        console.error('Onboarding fetch error:', err);
      }
    }
    fetchBusiness();
  }, []);

  // AI-powered website extraction
  const extractFromWebsite = useCallback(async () => {
    if (!website || extracting) return;

    // Ensure URL has protocol
    let url = website;
    if (!url.startsWith('http')) url = 'https://' + url;

    setExtracting(true);
    try {
      const res = await fetch('/api/ai/extract-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          if (data.name && !name) setName(data.name);
          if (data.phone && !phone) setPhone(data.phone);
          if (data.industry) setIndustry(data.industry);
          if (data.services?.length > 0) {
            setServices(data.services.map((s: Service) => ({
              name: s.name || '',
              price: s.price || '',
              duration_minutes: s.duration_minutes || '',
            })));
          }
          if (data.faqs?.length > 0) {
            setFaqs(data.faqs.map((f: FAQ) => ({
              question: f.question || '',
              answer: f.answer || '',
            })));
          }
          if (data.personality) setPersonality(data.personality);
          if (data.description) setExtraNotes(data.description);
          setExtractionDone(true);
        }
      }
    } catch (err) {
      console.error('AI extraction failed:', err);
    }
    setExtracting(false);
  }, [website, extracting, name, phone]);

  // Generate AI system prompt
  const generatePrompt = useCallback(async () => {
    setGeneratingPrompt(true);
    try {
      const res = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, industry, services: services.filter(s => s.name),
          faqs: faqs.filter(f => f.question && f.answer),
          personality, extraNotes, bookingUrl,
        }),
      });
      if (res.ok) {
        const { prompt } = await res.json();
        setGeneratedPrompt(prompt);
      }
    } catch (err) {
      console.error('Prompt generation failed:', err);
    }
    setGeneratingPrompt(false);
  }, [name, industry, services, faqs, personality, extraNotes, bookingUrl]);

  const syncActivation = useCallback(
    async (options?: { confirmWidgetInstalled?: boolean; forceWidgetCheck?: boolean }) => {
      if (!orgId) return;

      try {
        const response = await fetch('/api/activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmWidgetInstalled: options?.confirmWidgetInstalled,
            forceWidgetCheck: options?.forceWidgetCheck,
          }),
        });
        return await response.json().catch(() => null);
      } catch (error) {
        console.error('Activation sync failed:', error);
        return null;
      }
    },
    [orgId]
  );

  async function persistBusinessUpdate(updateData: Record<string, unknown>) {
    if (!orgId) return false;

    const { error } = await supabase.from('businesses').update(updateData).eq('id', orgId);
    if (error) {
      setFormError(error.message || 'Unable to save clinic details right now.');
      return false;
    }

    return true;
  }

  async function saveAndNext(updateData: Record<string, unknown>) {
    if (!orgId) return;
    setSaving(true);
    setFormError('');
    setStatusMessage('');

    const saved = await persistBusinessUpdate(updateData);
    if (saved) {
      await syncActivation();
      setStatusMessage('Saved successfully.');
      setStep((s) => s + 1);
    }

    setSaving(false);
  }

  useEffect(() => {
    if (step === 6 && !generatedPrompt && !generatingPrompt) {
      generatePrompt();
    }
  }, [step, generatedPrompt, generatingPrompt, generatePrompt]);

  // Screen 1 — Business basics with AI extraction
  if (step === 1) {
    return (
      <OnboardingShell
        step={1}
        title="Tell us about the clinic"
        subtitle="Start with the website and Zypflow will pull in the clinic details, service menu, and brand tone to speed up setup."
        statusMessage={statusMessage}
      >
        <div className="space-y-4">
          <StepHint
            title="Fastest path"
            description="Paste the live website first. We will scan it and prefill the boring setup work automatically."
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">Website URL</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.yourclinic.com"
                className={`flex-1 ${INPUT_CLASS_NAME}`}
                onBlur={() => {
                  if (website && !extractionDone) extractFromWebsite();
                }}
              />
              <button
                onClick={extractFromWebsite}
                disabled={extracting || !website}
                className={`${PRIMARY_BUTTON_CLASS_NAME} flex items-center justify-center gap-2 whitespace-nowrap`}
              >
                {extracting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    AI autofill
                  </>
                )}
              </button>
            </div>
            {extracting && (
              <InlineNotice tone="brand" className="mt-3">
                AI is scanning the website and extracting business details, services, FAQs, and brand tone.
              </InlineNotice>
            )}
            {extractionDone && !extracting && (
              <InlineNotice tone="success" className="mt-3">
                We found usable clinic details. Review them below and tighten anything that needs adjusting.
              </InlineNotice>
            )}
          </div>

          <div className="border-t border-[var(--app-border)] pt-4">
            <Field label="Business name" value={name} onChange={setName} placeholder="e.g. Bright Smile Dental" />
          </div>
          <Field label="Phone number" value={phone} onChange={setPhone} placeholder="+44 7700 900000" />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={INPUT_CLASS_NAME}
            >
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <NextButton
            loading={saving}
            error={formError}
            onClick={() => {
              const parsed = businessBasicsSchema.safeParse({ name, website, phone, industry });
              if (!parsed.success) {
                setFormError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
                return;
              }

              saveAndNext(parsed.data);
            }}
            disabled={!name}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 2 — Services (pre-filled by AI)
  if (step === 2) {
    return (
      <OnboardingShell
        step={2}
        title="Map the service menu"
        subtitle={
          extractionDone
            ? 'We pulled these from the website. Clean them up so the assistant can qualify leads and talk about the right treatments.'
            : 'Add the core services the clinic actually wants to convert.'
        }
        statusMessage={statusMessage}
      >
        <div className="space-y-3">
          {services.map((svc, i) => (
            <div key={i} className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_90px]">
              <input
                placeholder="Service name"
                value={svc.name}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setServices(updated);
                }}
                className={INPUT_CLASS_NAME}
              />
              <input
                placeholder="Price"
                value={svc.price}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i] = { ...updated[i], price: e.target.value };
                  setServices(updated);
                }}
                className={INPUT_CLASS_NAME}
              />
              <input
                placeholder="Mins"
                value={svc.duration_minutes}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i] = { ...updated[i], duration_minutes: e.target.value };
                  setServices(updated);
                }}
                className={INPUT_CLASS_NAME}
              />
              </div>
              {services.length > 1 && (
                <button
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                  className="mt-3 text-sm font-semibold text-rose-500 transition hover:text-rose-700"
                >
                  Remove service
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setServices([...services, { name: '', price: '', duration_minutes: '' }])}
            className="text-sm font-semibold text-brand-purple transition hover:text-brand-purple-dark"
          >
            + Add another service
          </button>
          <NextButton
            loading={saving}
            error={formError}
            onBack={() => setStep(1)}
            onClick={() =>
              saveAndNext({ services: services.filter((s) => s.name) })
            }
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 3 — FAQs (pre-filled by AI)
  if (step === 3) {
    return (
      <OnboardingShell
        step={3}
        title="Teach the assistant the common questions"
        subtitle={
          extractionDone
            ? 'These answers came from the website. Tighten them so the AI feels accurate and premium when patients ask basic questions.'
            : 'Add the clinic FAQs you want the assistant to answer clearly without a human handoff.'
        }
        statusMessage={statusMessage}
      >
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-3 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <input
                placeholder="Question"
                value={faq.question}
                onChange={(e) => {
                  const updated = [...faqs];
                  updated[i] = { ...updated[i], question: e.target.value };
                  setFaqs(updated);
                }}
                className={INPUT_CLASS_NAME}
              />
              <textarea
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const updated = [...faqs];
                  updated[i] = { ...updated[i], answer: e.target.value };
                  setFaqs(updated);
                }}
                rows={3}
                className={TEXTAREA_CLASS_NAME}
              />
              {faqs.length > 1 && (
                <button
                  onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                  className="text-sm font-semibold text-rose-500 transition hover:text-rose-700"
                >
                  Remove question
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
            className="text-sm font-semibold text-brand-purple transition hover:text-brand-purple-dark"
          >
            + Add another question
          </button>
          <NextButton
            loading={saving}
            error={formError}
            onBack={() => setStep(2)}
            onClick={() =>
              saveAndNext({ knowledge_base: faqs.filter((f) => f.question && f.answer) })
            }
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 4 — Booking & reviews
  if (step === 4) {
    return (
      <OnboardingShell
        step={4}
        title="Connect booking and review destinations"
        subtitle="This tells the assistant where serious enquiries should book and where happy patients should leave public proof."
        statusMessage={statusMessage}
      >
        <div className="space-y-4">
          <Field
            label="Booking link"
            value={bookingUrl}
            onChange={setBookingUrl}
            placeholder="https://calendly.com/your-business/30min"
          />
          <div>
            <Field
              label="Google review link"
              value={googleReviewLink}
              onChange={setGoogleReviewLink}
              placeholder="https://g.page/r/..."
            />
            <p className="mt-2 text-xs text-[var(--app-text-soft)]">
              Search &quot;Google review link generator&quot; to find yours
            </p>
          </div>
          <NextButton
            loading={saving}
            error={formError}
            onBack={() => setStep(3)}
            onClick={() => {
              const parsed = bookingLinksSchema.safeParse({ bookingUrl, googleReviewLink });
              if (!parsed.success) {
                setFormError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
                return;
              }

              saveAndNext({
                booking_url: parsed.data.bookingUrl,
                google_review_link: parsed.data.googleReviewLink,
              });
            }}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 5 — AI personality
  if (step === 5) {
    return (
      <OnboardingShell
        step={5}
        title="Choose the assistant tone"
        subtitle={
          extractionDone
            ? 'We inferred a likely tone from the website, but this is where you make the assistant sound properly on-brand.'
            : 'Pick the voice that fits how the clinic should feel when a lead first reaches out.'
        }
        statusMessage={statusMessage}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPersonality(p.value)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  personality === p.value
                    ? 'border-brand-purple/30 bg-brand-purple/8 ring-2 ring-brand-purple/10'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:border-brand-purple/20'
                }`}
              >
                <p className={`text-sm font-semibold ${personality === p.value ? 'text-brand-purple' : 'text-[var(--app-text)]'}`}>
                  {p.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">{p.description}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
              Anything else the AI should know?
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              rows={3}
              placeholder="e.g. We are closed on Sundays, We only serve the SW London area"
              className={TEXTAREA_CLASS_NAME}
            />
          </div>
          <NextButton
            loading={saving}
            error={formError}
            onBack={() => setStep(4)}
            onClick={async () => {
              if (!orgId) return;
              setSaving(true);
              setFormError('');
              setStatusMessage('');

              const updateData: Record<string, unknown> = { ai_personality: personality };

              if (extraNotes) {
                const { data: current } = await supabase
                  .from('businesses')
                  .select('knowledge_base')
                  .eq('id', orgId)
                  .single();
                const existing = (current?.knowledge_base as FAQ[]) || [];
                updateData.knowledge_base = [
                  ...existing,
                  { question: 'Additional business info', answer: extraNotes },
                ];
              }

              const saved = await persistBusinessUpdate(updateData);
              if (saved) {
                await syncActivation();
                setStatusMessage('Tone saved.');
                setStep(6);
              }
              setSaving(false);
            }}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 6 — AI-generated system prompt preview
  if (step === 6) {
    return (
      <OnboardingShell
        step={6}
        title="Review the assistant brief"
        subtitle="This prompt powers how the assistant qualifies, answers questions, and hands off to the booking flow."
        statusMessage={statusMessage}
      >
        <div className="space-y-4">
          {generatingPrompt ? (
            <div className="rounded-[24px] border border-brand-purple/20 bg-brand-purple/8 p-6 text-center">
              <span className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-brand-purple border-t-transparent" />
              <p className="text-sm text-brand-purple">AI is drafting the assistant prompt...</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--app-text-soft)]">AI system prompt</p>
              <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--app-text-muted)]">{generatedPrompt}</pre>
            </div>
          )}
          <NextButton
            loading={saving}
            error={formError}
            onBack={() => setStep(5)}
            onClick={async () => {
              if (!orgId) return;
              setSaving(true);
              setFormError('');
              setStatusMessage('');
              if (generatedPrompt) {
                const saved = await persistBusinessUpdate({ system_prompt: generatedPrompt });
                if (!saved) {
                  setSaving(false);
                  return;
                }
              }
              await syncActivation();
              setStatusMessage('Assistant brief saved.');
              setSaving(false);
              setStep(7);
            }}
            label="Use this prompt"
          />
          <button
            onClick={generatePrompt}
            disabled={generatingPrompt}
            className="w-full text-sm font-semibold text-brand-purple transition hover:text-brand-purple-dark"
          >
            Regenerate prompt
          </button>
        </div>
      </OnboardingShell>
    );
  }

  // Screen 7 — Widget installation
  if (step === 7) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';
    const embedCode = `<script src="${appUrl}/v1.js" data-org-id="${orgId}"></script>`;

    return (
      <OnboardingShell
        step={7}
        title="Verify your live widget install"
        subtitle="Install the one-line script, then let Zypflow confirm the clinic is launch-ready."
        statusMessage={statusMessage}
      >
        <div className="space-y-4">
          <div className="break-all rounded-[24px] bg-slate-950 p-4 font-mono text-sm text-emerald-300 shadow-[0_24px_60px_rgba(15,23,42,0.35)]">
            {embedCode}
          </div>
          <StepHint
            title="What this unlocks"
            description="Once the widget is live, Zypflow can capture leads, answer common questions, and feed the follow-up and proof engine without manual admin."
          />
          <button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className={PRIMARY_BUTTON_CLASS_NAME}
          >
            Copy to clipboard
          </button>
          <div className="space-y-2 rounded-[24px] border border-sky-500/20 bg-sky-500/8 p-4 text-sm text-sky-800 dark:text-sky-200">
            <p><strong>WordPress:</strong> Install &quot;Insert Headers and Footers&quot; plugin -&gt; Settings -&gt; paste in footer.</p>
            <p><strong>Wix:</strong> Settings -&gt; Custom Code -&gt; Add Code -&gt; paste in body end.</p>
            <p><strong>Squarespace:</strong> Settings -&gt; Advanced -&gt; Code Injection -&gt; Footer.</p>
            <p><strong>Shopify:</strong> Online Store -&gt; Themes -&gt; Edit Code -&gt; theme.liquid -&gt; before &lt;/body&gt;.</p>
            <p><strong>Not sure?</strong> Send this step to whoever manages the site and ask them to paste the script before the closing body tag.</p>
          </div>
          <NextButton
            loading={saving}
            error={formError}
            onBack={() => setStep(6)}
            onClick={async () => {
              setSaving(true);
              setFormError('');
              setStatusMessage('');

              const activationPayload = await syncActivation({
                confirmWidgetInstalled: true,
                forceWidgetCheck: true,
              });

              if (!activationPayload?.activation?.widgetInstalled) {
                setFormError(
                  'We could not verify the widget on the website yet. Check the install, wait a minute, and try again.'
                );
                setSaving(false);
                return;
              }

              setStatusMessage('Widget verified.');
              setSaving(false);
              setStep(8);
            }}
            label="Verify install and continue"
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 8 — Done
  return (
    <OnboardingShell
      step={8}
      title="Launch complete"
      subtitle="The clinic workspace is ready. From here the dashboard becomes the daily command center for leads, bookings, reviews, and proof."
      statusMessage={statusMessage}
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/12">
          <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--app-text)]">What happens next?</h3>
          <div className="mx-auto max-w-sm space-y-2 text-left text-sm text-[var(--app-text-muted)]">
            <p className="flex items-start gap-2"><span className="font-bold text-brand-purple">1.</span> Visitors chat with the assistant on your website.</p>
            <p className="flex items-start gap-2"><span className="font-bold text-brand-purple">2.</span> The AI captures name, email, and phone automatically.</p>
            <p className="flex items-start gap-2"><span className="font-bold text-brand-purple">3.</span> The clinic gets instant visibility on every new lead.</p>
            <p className="flex items-start gap-2"><span className="font-bold text-brand-purple">4.</span> Follow-ups keep warm leads moving toward a booking.</p>
            <p className="flex items-start gap-2"><span className="font-bold text-brand-purple">5.</span> Review requests go out automatically after appointments.</p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => { localStorage.removeItem('zyp-onboarding-step'); router.push('/dashboard'); }}
            className={PRIMARY_BUTTON_CLASS_NAME}
          >
            Go to dashboard
          </button>
          <a
            href={process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Book a setup call
          </a>
        </div>
      </div>
    </OnboardingShell>
  );
}

function OnboardingShell({ step, title, subtitle, statusMessage, children }: {
  step: number; title: string; subtitle?: string; statusMessage?: string; children: React.ReactNode;
}) {
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = Math.round((step / totalSteps) * 100);
  return (
    <div className="min-h-screen px-4 py-8 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="public-frame reveal-up">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="page-eyebrow">Clinic launch setup</p>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">Step {step} of {totalSteps}</p>
            </div>
            <div className="rounded-full border border-[var(--app-card-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
              {progress}% ready
            </div>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-[var(--app-muted)]">
            <div
              className="h-full rounded-full bg-brand-purple transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {statusMessage ? (
            <div className="mt-4 rounded-[20px] border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {statusMessage}
            </div>
          ) : null}
        </div>

        <aside className="surface-panel reveal-up reveal-delay-1 rounded-[32px] p-6">
          <p className="page-eyebrow">What this setup creates</p>
          <div className="mt-4 rounded-[24px] bg-[var(--app-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--app-text)]">A clinic-ready revenue system</p>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              By the end of onboarding, Zypflow is ready to capture leads, protect appointments, request reviews, and show proof in the dashboard.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {ONBOARDING_STEPS.map((item, index) => {
              const currentStep = index + 1;
              const isComplete = currentStep < step;
              const isActive = currentStep === step;

              return (
                <div
                  key={item.title}
                  className={`rounded-[22px] border px-4 py-3 transition ${
                    isActive
                      ? 'border-brand-purple/25 bg-brand-purple/8'
                      : isComplete
                        ? 'border-emerald-500/15 bg-emerald-500/8'
                        : 'border-[var(--app-border)] bg-[var(--app-surface)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isComplete
                          ? 'bg-emerald-600 text-white'
                          : isActive
                            ? 'bg-brand-purple text-white'
                            : 'bg-[var(--app-muted)] text-[var(--app-text-soft)]'
                      }`}
                    >
                      {isComplete ? '✓' : currentStep}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-text)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS_NAME}
      />
    </div>
  );
}

function StepHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--app-card-border)] bg-[var(--app-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
    </div>
  );
}

function InlineNotice({
  children,
  tone,
  className = '',
}: {
  children: React.ReactNode;
  tone: 'brand' | 'success';
  className?: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
      : 'border-brand-purple/20 bg-brand-purple/8 text-brand-purple';

  return <div className={`rounded-[20px] border px-4 py-3 text-sm ${toneClass} ${className}`.trim()}>{children}</div>;
}

function NextButton({ loading, onClick, disabled, label, onBack, error }: {
  loading: boolean; onClick: () => void; disabled?: boolean; label?: string; onBack?: () => void; error?: string;
}) {
  return (
    <div className="mt-4 space-y-3">
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        {onBack && (
          <button
            onClick={onBack}
            type="button"
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Back
          </button>
        )}
        <button
          onClick={onClick}
          disabled={loading || disabled}
          className={`flex-1 ${PRIMARY_BUTTON_CLASS_NAME}`}
        >
          {loading ? 'Saving...' : label || 'Next'}
        </button>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
