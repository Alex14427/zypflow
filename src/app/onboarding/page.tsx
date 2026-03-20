'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
const PERSONALITIES = [
  { value: 'warm and friendly', label: 'Warm & Friendly', description: 'Approachable, puts customers at ease' },
  { value: 'professional and formal', label: 'Professional & Formal', description: 'Authoritative, builds trust through expertise' },
  { value: 'casual and approachable', label: 'Casual & Approachable', description: 'Relaxed, like chatting with a friend' },
  { value: 'luxury and sophisticated', label: 'Luxury & Sophisticated', description: 'Premium feel, exclusive and polished' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

  // Fetch business ID on mount
  useEffect(() => {
    async function fetchBusiness() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('businesses')
          .select('id, name, website, phone, industry')
          .eq('email', user.email)
          .maybeSingle();
        if (data) {
          setBusinessId(data.id);
          if (data.name) setName(data.name);
          if (data.website) setWebsite(data.website);
          if (data.phone) setPhone(data.phone);
          if (data.industry) setIndustry(data.industry);
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

  async function saveAndNext(updateData: Record<string, unknown>) {
    if (!businessId) return;
    setSaving(true);
    await supabase.from('businesses').update(updateData).eq('id', businessId);
    setSaving(false);
    setStep((s) => s + 1);
  }

  // Screen 1 — Business basics with AI extraction
  if (step === 1) {
    return (
      <OnboardingShell step={1} title="Tell us about your business" subtitle="Enter your website and we'll auto-fill everything with AI.">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.yourbusiness.com"
                className="flex-1 border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
                onBlur={() => {
                  if (website && !extractionDone) extractFromWebsite();
                }}
              />
              <button
                onClick={extractFromWebsite}
                disabled={extracting || !website}
                className="bg-gradient-to-r from-[#6c3cff] to-[#8b5cf6] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
              >
                {extracting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    AI Auto-fill
                  </>
                )}
              </button>
            </div>
            {extracting && (
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                  AI is scanning your website and extracting business details, services, and FAQs...
                </div>
              </div>
            )}
            {extractionDone && !extracting && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium">
                  AI extracted your business details! Review and adjust below, then continue.
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <Field label="Business Name" value={name} onChange={setName} placeholder="e.g. Bright Smile Dental" />
          </div>
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+44 7700 900000" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
            >
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <NextButton
            loading={saving}
            onClick={() => saveAndNext({ name, website, phone, industry })}
            disabled={!name}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 2 — Services (pre-filled by AI)
  if (step === 2) {
    return (
      <OnboardingShell step={2} title="What services do you offer?" subtitle={extractionDone ? 'We found these from your website. Add, edit, or remove as needed.' : 'List the services your business provides.'}>
        <div className="space-y-3">
          {services.map((svc, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                placeholder="Service name"
                value={svc.name}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setServices(updated);
                }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
              />
              <input
                placeholder="Price"
                value={svc.price}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i] = { ...updated[i], price: e.target.value };
                  setServices(updated);
                }}
                className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
              />
              <input
                placeholder="Mins"
                value={svc.duration_minutes}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i] = { ...updated[i], duration_minutes: e.target.value };
                  setServices(updated);
                }}
                className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
              />
              {services.length > 1 && (
                <button
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 text-lg mt-1"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setServices([...services, { name: '', price: '', duration_minutes: '' }])}
            className="text-sm text-[#6c3cff] hover:underline"
          >
            + Add another service
          </button>
          <NextButton
            loading={saving}
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
      <OnboardingShell step={3} title="Common questions your customers ask" subtitle={extractionDone ? 'AI generated these from your website. Edit or add more.' : 'Add 5-10 questions your AI should be able to answer.'}>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <input
                placeholder="Question"
                value={faq.question}
                onChange={(e) => {
                  const updated = [...faqs];
                  updated[i] = { ...updated[i], question: e.target.value };
                  setFaqs(updated);
                }}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
              />
              <textarea
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const updated = [...faqs];
                  updated[i] = { ...updated[i], answer: e.target.value };
                  setFaqs(updated);
                }}
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
              />
              {faqs.length > 1 && (
                <button
                  onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
            className="text-sm text-[#6c3cff] hover:underline"
          >
            + Add another question
          </button>
          <NextButton
            loading={saving}
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
      <OnboardingShell step={4} title="Booking & Reviews" subtitle="Connect your booking system and Google reviews.">
        <div className="space-y-4">
          <Field
            label="Booking Link"
            value={bookingUrl}
            onChange={setBookingUrl}
            placeholder="https://calendly.com/your-business/30min"
          />
          <div>
            <Field
              label="Google Review Link"
              value={googleReviewLink}
              onChange={setGoogleReviewLink}
              placeholder="https://g.page/r/..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Search &quot;Google review link generator&quot; to find yours
            </p>
          </div>
          <NextButton
            loading={saving}
            onBack={() => setStep(3)}
            onClick={() => saveAndNext({ booking_url: bookingUrl, google_review_link: googleReviewLink })}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 5 — AI personality
  if (step === 5) {
    return (
      <OnboardingShell step={5} title="How should your AI assistant sound?" subtitle={extractionDone ? 'We picked a style based on your website tone. Change it if you prefer.' : 'Choose the personality that fits your brand.'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPersonality(p.value)}
                className={`border rounded-lg p-4 text-left transition ${
                  personality === p.value
                    ? 'border-[#6c3cff] bg-purple-50 ring-2 ring-[#6c3cff]/20'
                    : 'hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-medium ${personality === p.value ? 'text-[#6c3cff]' : 'text-gray-900'}`}>
                  {p.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{p.description}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anything else the AI should know?
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              rows={3}
              placeholder="e.g. We are closed on Sundays, We only serve the SW London area"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
            />
          </div>
          <NextButton
            loading={saving}
            onBack={() => setStep(4)}
            onClick={async () => {
              if (!businessId) return;
              setSaving(true);

              const updateData: Record<string, unknown> = { ai_personality: personality };

              if (extraNotes) {
                const { data: current } = await supabase
                  .from('businesses')
                  .select('knowledge_base')
                  .eq('id', businessId)
                  .single();
                const existing = (current?.knowledge_base as FAQ[]) || [];
                updateData.knowledge_base = [
                  ...existing,
                  { question: 'Additional business info', answer: extraNotes },
                ];
              }

              await supabase.from('businesses').update(updateData).eq('id', businessId);
              setSaving(false);
              setStep(6);
            }}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 6 — AI-generated system prompt preview
  if (step === 6) {
    if (!generatedPrompt && !generatingPrompt) {
      generatePrompt();
    }

    return (
      <OnboardingShell step={6} title="Your AI assistant is ready" subtitle="Here's how your AI will behave. You can customize this anytime in Settings.">
        <div className="space-y-4">
          {generatingPrompt ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <span className="inline-block animate-spin w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm text-purple-700">AI is crafting your custom assistant personality...</p>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">AI System Prompt (auto-generated)</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{generatedPrompt}</pre>
            </div>
          )}
          <NextButton
            loading={saving}
            onBack={() => setStep(5)}
            onClick={async () => {
              if (!businessId) return;
              setSaving(true);
              if (generatedPrompt) {
                await supabase.from('businesses').update({ system_prompt: generatedPrompt }).eq('id', businessId);
              }
              setSaving(false);
              setStep(7);
            }}
            label="Use This Prompt"
          />
          <button
            onClick={generatePrompt}
            disabled={generatingPrompt}
            className="w-full text-sm text-[#6c3cff] hover:underline"
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
    const embedCode = `<script src="${appUrl}/v1.js" data-business-id="${businessId}"></script>`;

    return (
      <OnboardingShell step={7} title="Install your chat widget" subtitle="One line of code — that's all it takes.">
        <div className="space-y-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono break-all">
            {embedCode}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className="bg-[#6c3cff] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#5a2de0] transition"
          >
            Copy to Clipboard
          </button>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
            <p><strong>WordPress:</strong> Install &quot;Insert Headers and Footers&quot; plugin &rarr; Settings &rarr; paste in Footer</p>
            <p><strong>Wix:</strong> Settings &rarr; Custom Code &rarr; Add Code &rarr; paste in Body End</p>
            <p><strong>Squarespace:</strong> Settings &rarr; Advanced &rarr; Code Injection &rarr; Footer</p>
            <p><strong>Shopify:</strong> Online Store &rarr; Themes &rarr; Edit Code &rarr; theme.liquid &rarr; before &lt;/body&gt;</p>
            <p><strong>Not sure?</strong> Forward this page to whoever manages your website</p>
          </div>
          <NextButton loading={false} onBack={() => setStep(6)} onClick={() => setStep(8)} label="Continue" />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 8 — Done
  return (
    <OnboardingShell step={8} title="You're all set!" subtitle="Your AI assistant is live and ready to convert visitors into customers.">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens next?</h3>
          <div className="text-sm text-gray-600 space-y-2 text-left max-w-sm mx-auto">
            <p className="flex items-start gap-2"><span className="text-[#6c3cff] font-bold">1.</span> Visitors chat with your AI on your website</p>
            <p className="flex items-start gap-2"><span className="text-[#6c3cff] font-bold">2.</span> AI captures their name, email, and phone automatically</p>
            <p className="flex items-start gap-2"><span className="text-[#6c3cff] font-bold">3.</span> You get instant notifications for every new lead</p>
            <p className="flex items-start gap-2"><span className="text-[#6c3cff] font-bold">4.</span> Automated follow-ups nurture leads who don&apos;t book immediately</p>
            <p className="flex items-start gap-2"><span className="text-[#6c3cff] font-bold">5.</span> Review requests go out automatically after appointments</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { localStorage.removeItem('zyp-onboarding-step'); router.push('/dashboard'); }}
            className="bg-[#6c3cff] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#5a2de0] transition"
          >
            Go to Dashboard
          </button>
          <a
            href={process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Book a setup call
          </a>
        </div>
      </div>
    </OnboardingShell>
  );
}

// --- Helper components ---

function OnboardingShell({ step, title, subtitle, children }: {
  step: number; title: string; subtitle?: string; children: React.ReactNode;
}) {
  const totalSteps = 8;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center gap-1 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#6c3cff]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-1">Step {step} of {totalSteps}</p>
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6c3cff]"
      />
    </div>
  );
}

function NextButton({ loading, onClick, disabled, label, onBack }: {
  loading: boolean; onClick: () => void; disabled?: boolean; label?: string; onBack?: () => void;
}) {
  return (
    <div className="flex gap-3 mt-4">
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className="px-6 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
        >
          Back
        </button>
      )}
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="flex-1 bg-[#6c3cff] text-white py-2.5 rounded-lg font-semibold hover:bg-[#5a2de0] transition disabled:opacity-50"
      >
        {loading ? 'Saving...' : label || 'Next'}
      </button>
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
