'use client';

import { useState, useEffect } from 'react';
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
  { value: 'warm and friendly', label: 'Warm and friendly' },
  { value: 'professional and formal', label: 'Professional and formal' },
  { value: 'casual and approachable', label: 'Casual and approachable' },
  { value: 'luxury and sophisticated', label: 'Luxury and sophisticated' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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

  // Fetch business ID on mount
  useEffect(() => {
    async function fetchBusiness() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('businesses')
        .select('id, name, website, phone, industry')
        .eq('email', user.email)
        .single();
      if (data) {
        setBusinessId(data.id);
        if (data.name) setName(data.name);
        if (data.website) setWebsite(data.website);
        if (data.phone) setPhone(data.phone);
        if (data.industry) setIndustry(data.industry);
      }
    }
    fetchBusiness();
  }, []);

  async function saveAndNext(updateData: Record<string, unknown>) {
    if (!businessId) return;
    setSaving(true);
    await supabase.from('businesses').update(updateData).eq('id', businessId);
    setSaving(false);
    setStep((s) => s + 1);
  }

  // Screen 1
  if (step === 1) {
    return (
      <OnboardingShell step={1} title="Tell us about your business">
        <div className="space-y-4">
          <Field label="Business Name" value={name} onChange={setName} placeholder="e.g. Bright Smile Dental" />
          <Field label="Website URL" value={website} onChange={setWebsite} placeholder="https://www.example.com" />
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

  // Screen 2 — Services
  if (step === 2) {
    return (
      <OnboardingShell step={2} title="What services do you offer?">
        <div className="space-y-3">
          {services.map((svc, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                placeholder="Service name"
                value={svc.name}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i].name = e.target.value;
                  setServices(updated);
                }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Price"
                value={svc.price}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i].price = e.target.value;
                  setServices(updated);
                }}
                className="w-24 border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Mins"
                value={svc.duration_minutes}
                onChange={(e) => {
                  const updated = [...services];
                  updated[i].duration_minutes = e.target.value;
                  setServices(updated);
                }}
                className="w-20 border rounded-lg px-3 py-2 text-sm"
              />
              {services.length > 1 && (
                <button
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 text-lg"
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
            onClick={() =>
              saveAndNext({ services: services.filter((s) => s.name) })
            }
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 3 — FAQs
  if (step === 3) {
    return (
      <OnboardingShell step={3} title="Common questions your customers ask">
        <p className="text-sm text-gray-500 mb-4">Add 5-10 questions your AI should be able to answer.</p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <input
                placeholder="Question"
                value={faq.question}
                onChange={(e) => {
                  const updated = [...faqs];
                  updated[i].question = e.target.value;
                  setFaqs(updated);
                }}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const updated = [...faqs];
                  updated[i].answer = e.target.value;
                  setFaqs(updated);
                }}
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm"
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
      <OnboardingShell step={4} title="Booking & Reviews">
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
            onClick={() => saveAndNext({ booking_url: bookingUrl, google_review_link: googleReviewLink })}
          />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 5 — AI personality
  if (step === 5) {
    return (
      <OnboardingShell step={5} title="How should your AI assistant sound?">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPersonality(p.value)}
                className={`border rounded-lg p-3 text-sm text-left transition ${
                  personality === p.value
                    ? 'border-[#6c3cff] bg-purple-50 text-[#6c3cff]'
                    : 'hover:border-gray-300'
                }`}
              >
                {p.label}
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
            onClick={async () => {
              if (!businessId) return;
              setSaving(true);

              // Save personality
              const updateData: Record<string, unknown> = { ai_personality: personality };

              // If extra notes, fetch current knowledge_base and append
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

  // Screen 6 — Widget installation
  if (step === 6) {
    const embedCode = `<script src="https://app.zypflow.com/v1.js" data-business-id="${businessId}"></script>`;

    return (
      <OnboardingShell step={6} title="Install your chat widget">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Paste this one line of code just before the <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag on your website:
          </p>
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
            <p><strong>Not sure?</strong> Forward this page to whoever manages your website</p>
          </div>
          <NextButton loading={false} onClick={() => setStep(7)} label="Continue" />
        </div>
      </OnboardingShell>
    );
  }

  // Screen 7 — Done
  return (
    <OnboardingShell step={7} title="You're all set!">
      <div className="text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <p className="text-gray-600">
          Your AI assistant is ready! It will start capturing leads as soon as the
          widget code is live on your website.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#6c3cff] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#5a2de0] transition"
          >
            Go to Dashboard
          </button>
          <a
            href="https://calendly.com/alex-zypflow/30min"
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

function OnboardingShell({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#6c3cff]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-1">Step {step} of 7</p>
        <h2 className="text-xl font-bold mb-6">{title}</h2>
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

function NextButton({ loading, onClick, disabled, label }: {
  loading: boolean; onClick: () => void; disabled?: boolean; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full bg-[#6c3cff] text-white py-2.5 rounded-lg font-semibold hover:bg-[#5a2de0] transition disabled:opacity-50 mt-4"
    >
      {loading ? 'Saving...' : label || 'Next'}
    </button>
  );
}
