import { LegalLayout } from '@/components/public/legal-layout';

export const metadata = {
  title: 'Terms of Service - Zypflow',
  description: 'Commercial and usage terms for Zypflow managed clinic automation.',
};

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Terms of service"
      title="The commercial and operating terms behind the Zypflow platform."
      summary="These terms explain how the managed product works, how billing is handled, what clinics are responsible for, and the guardrails that keep the platform safe for patients, clinics, and Zypflow."
      lastUpdated="3 April 2026"
    >
      <section>
        <h2>1. Agreement</h2>
        <p>By accessing or using Zypflow, you agree to these terms. If you do not agree, do not use the service.</p>
      </section>

      <section>
        <h2>2. What Zypflow provides</h2>
        <p>Zypflow is a managed automation platform for private clinics and appointment-led service businesses. Depending on configuration, the service may include lead capture, AI-assisted conversations, reminders, review requests, reporting, outreach tooling, and founder-managed deployment support.</p>
      </section>

      <section>
        <h2>3. Workspace approval and access</h2>
        <p>Not every signup automatically becomes a live paid clinic. We may approve, decline, or manually configure a workspace before full launch. You are responsible for keeping account credentials secure and for ensuring only authorised staff access the workspace.</p>
      </section>

      <section>
        <h2>4. Billing and commercial model</h2>
        <ul>
          <li>The public commercial offer may include a one-time setup fee and a recurring monthly service fee.</li>
          <li>For the founding pilot offer, the current default commercial framing is a managed pilot with a setup fee, monthly recurring billing, and a minimum initial term.</li>
          <li>Charges may be collected through Stripe or another approved payment provider.</li>
          <li>Usage-based charges, overages, or additional managed work are only included if expressly agreed.</li>
          <li>Unless otherwise agreed in writing, Zypflow is not sold as unlimited custom agency work.</li>
        </ul>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You agree not to use Zypflow to send spam, break applicable law, access other users&apos; data without permission, or generate misleading, harmful, or unlawful content. You must not use the messaging features without appropriate legal basis, consent, or suppression handling where required.</p>
      </section>

      <section>
        <h2>6. Customer data and responsibility</h2>
        <p>You retain ownership of your clinic and customer data. You grant us the rights needed to host, process, and transmit that data to provide the service. You are responsible for ensuring that the data you collect and the communications you trigger through the platform are lawful.</p>
      </section>

      <section>
        <h2>7. AI-assisted outputs</h2>
        <p>AI-generated outputs can be useful and can still be wrong. You remain responsible for how the system is configured, what your staff approve, and what policies apply to your clinic. Zypflow is designed to reduce admin and improve conversion, not to replace professional judgement.</p>
      </section>

      <section>
        <h2>8. Service availability</h2>
        <p>We aim to operate a stable and reliable platform, but availability can be affected by third-party infrastructure providers, scheduled maintenance, or external outages. We do not guarantee uninterrupted service.</p>
      </section>

      <section>
        <h2>9. Suspension and termination</h2>
        <p>We may suspend or terminate access if you breach these terms, misuse the system, create legal or reputational risk, or fail to pay agreed charges. You may also request cancellation subject to any agreed minimum term and outstanding payment obligations.</p>
      </section>

      <section>
        <h2>10. Liability</h2>
        <p>To the maximum extent permitted by law, Zypflow is not liable for indirect or consequential losses. Our total liability for claims connected to the service will generally be limited to the amount you paid us in the preceding 12 months, except where law prevents that limitation.</p>
      </section>

      <section>
        <h2>11. Governing law</h2>
        <p>These terms are governed by the laws of England and Wales. Disputes will be handled by the courts of England and Wales unless applicable law requires otherwise.</p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>For contractual or commercial questions, email <a href="mailto:hello@zypflow.com">hello@zypflow.com</a>.</p>
      </section>
    </LegalLayout>
  );
}
