import { LegalLayout } from '@/components/public/legal-layout';

export const metadata = {
  title: 'Privacy Policy - Zypflow',
  description: 'How Zypflow collects, stores, and processes clinic, prospect, and patient data.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy policy"
      title="How Zypflow handles clinic, lead, and patient data."
      summary="This page explains what we collect, why we collect it, how long we keep it, and the controls available to clinics and end users. It is written to support a managed clinic-growth platform running in the UK."
      lastUpdated="3 April 2026"
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          Zypflow (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides an AI-assisted revenue and client-operations platform for UK private clinics and other appointment-led service businesses. If you have privacy or data-protection questions, email <a href="mailto:hello@zypflow.com">hello@zypflow.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Data we collect</h2>
        <p>Depending on how you use the platform, we may collect:</p>
        <ul>
          <li><strong>Account data:</strong> owner name, email address, phone number, clinic name, login records, and billing contacts.</li>
          <li><strong>Clinic configuration data:</strong> services, booking links, FAQs, review links, AI prompt settings, brand assets, and launch-status information.</li>
          <li><strong>Lead and customer data:</strong> names, emails, phone numbers, service interest, conversation history, booking status, reminder state, and follow-up history.</li>
          <li><strong>Payment and subscription data:</strong> billing identifiers, subscription state, invoices, and limited payment metadata handled through Stripe.</li>
          <li><strong>Usage and device data:</strong> IP address, browser information, product usage events, system logs, and operational diagnostics.</li>
        </ul>
      </section>

      <section>
        <h2>3. How we use data</h2>
        <ul>
          <li>To operate the Zypflow platform, including lead capture, booking prompts, reminders, review requests, and reporting.</li>
          <li>To configure and improve AI-assisted workflows using the information clinics choose to provide.</li>
          <li>To secure the platform, investigate failures, and monitor operational health.</li>
          <li>To manage subscriptions, send service notices, and provide support.</li>
          <li>To comply with legal, accounting, tax, and regulatory obligations.</li>
        </ul>
      </section>

      <section>
        <h2>4. Legal bases for processing</h2>
        <p>Where UK GDPR applies, we generally rely on one or more of the following bases:</p>
        <ul>
          <li><strong>Contract:</strong> where processing is necessary to provide the platform or managed services a clinic has signed up for.</li>
          <li><strong>Legitimate interests:</strong> for product security, fraud prevention, operational monitoring, analytics, and product improvement.</li>
          <li><strong>Consent:</strong> where consent is required for particular communications or tracking.</li>
          <li><strong>Legal obligation:</strong> where we must retain or disclose information to comply with law.</li>
        </ul>
      </section>

      <section>
        <h2>5. Processors and service providers</h2>
        <p>We use specialist infrastructure providers to operate the service. Depending on configuration, these may include Supabase, Stripe, Twilio, Resend, Vercel, OpenAI, Anthropic, PostHog, and Sentry. We use these providers to store data, send messages, process payments, host the application, and support AI-assisted workflows.</p>
      </section>

      <section>
        <h2>6. Retention</h2>
        <p>We keep account and clinic configuration data while an account is active. We keep lead, booking, review, and conversation data for as long as needed to operate the service and provide reporting, unless a shorter retention policy is agreed or required by law. After cancellation, we aim to remove or anonymize data within a reasonable period unless retention is legally required.</p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>Where applicable, you may have rights to access, correct, erase, restrict, object to, or export personal data. Email <a href="mailto:hello@zypflow.com">hello@zypflow.com</a> to make a request. We may ask for verification before acting on a request.</p>
      </section>

      <section>
        <h2>8. Messaging and opt-out controls</h2>
        <p>Clinics are responsible for using Zypflow in line with UK GDPR and PECR, including consent and suppression requirements. Where supported, we process STOP and unsubscribe actions automatically and expose suppression controls in the system.</p>
      </section>

      <section>
        <h2>9. Security</h2>
        <p>We use a combination of access controls, environment-based secrets, operational diagnostics, and third-party infrastructure safeguards to protect data. No online service is completely risk-free, but we aim to apply reasonable technical and organisational measures relative to the service we provide.</p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>We may update this policy from time to time. Material changes will be reflected on this page and, where appropriate, communicated directly.</p>
      </section>

      <section>
        <h2>11. Contact and complaints</h2>
        <p>
          For privacy questions, contact <a href="mailto:hello@zypflow.com">hello@zypflow.com</a>. If you are unhappy with our response and UK data-protection law applies, you may also contact the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">Information Commissioner&apos;s Office</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
