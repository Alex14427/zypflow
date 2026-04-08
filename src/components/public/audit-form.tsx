'use client';

import { useState } from 'react';
import posthog from 'posthog-js';
import { auditRequestSchema } from '@/lib/validators';

type AuditFormProps = {
  compact?: boolean;
};

const INITIAL_STATE = {
  name: '',
  business: '',
  website: '',
  email: '',
  phone: '',
};

export function AuditForm({ compact = false }: AuditFormProps) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = auditRequestSchema.safeParse({
      ...form,
      source: 'revenue_leak_audit',
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? 'Something went wrong. Please try again.');
        return;
      }

      posthog.capture('audit_form_submitted', { website: parsed.data.website });
      setSubmitted(true);
      setForm(INITIAL_STATE);

      if (payload.reportPath) {
        window.location.assign(payload.reportPath);
        return;
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        data-testid="audit-form"
        className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
      >
        <p className="font-semibold">Audit request received.</p>
        <p className="mt-2 text-emerald-700 dark:text-emerald-200">
          We&apos;re opening your Revenue Leak Audit now.
        </p>
        <p className="mt-2 text-emerald-700 dark:text-emerald-200">
          If the report does not open automatically, refresh this page in a moment.
        </p>
      </div>
    );
  }

  return (
    <form data-testid="audit-form" noValidate onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor="audit-name"
          input={
            <input
              id="audit-name"
              name="name"
              placeholder="Your name"
              maxLength={80}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="audit-input"
            />
          }
        />
        <Field
          label="Clinic name"
          htmlFor="audit-business"
          input={
            <input
              id="audit-business"
              name="business"
              placeholder="Clinic name"
              maxLength={120}
              value={form.business}
              onChange={(event) => setForm((current) => ({ ...current, business: event.target.value }))}
              className="audit-input"
            />
          }
        />
      </div>
      <Field
        label="Clinic website"
        htmlFor="audit-website"
        input={
          <input
            id="audit-website"
            name="website"
            type="url"
            placeholder="Clinic website"
            maxLength={200}
            value={form.website}
            onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            className="audit-input"
          />
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Email address"
          htmlFor="audit-email"
          input={
            <input
              id="audit-email"
              name="email"
              type="email"
              placeholder="Email address"
              maxLength={120}
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="audit-input"
            />
          }
        />
        <Field
          label="Phone (optional)"
          htmlFor="audit-phone"
          input={
            <input
              id="audit-phone"
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              maxLength={25}
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="audit-input"
            />
          }
        />
      </div>
      <p
        id="audit-form-error"
        data-testid="audit-form-error"
        aria-live="polite"
        className={`text-sm ${error ? 'block text-red-600 dark:text-red-300' : 'hidden'}`}
      >
        {error}
      </p>
      <button
        type="submit"
        disabled={loading}
        className={`button-primary w-full justify-center ${compact ? '' : 'shadow-[0_18px_35px_rgba(210,102,69,0.22)]'} disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {loading ? 'Scanning site...' : 'Run My Revenue Leak Audit'}
      </button>
      <p className="text-center text-xs text-[var(--app-text-soft)]">
        We scan public pages only and return the fastest conversion leaks to fix first.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  input,
}: {
  label: string;
  htmlFor: string;
  input: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">{label}</span>
      {input}
    </label>
  );
}
