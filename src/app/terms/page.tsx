export const metadata = {
  title: 'Terms of Service — Zypflow',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: 19 March 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Agreement to terms</h2>
          <p>By accessing or using Zypflow (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. The Service is operated by Zypflow (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Description of service</h2>
          <p>Zypflow is an AI-powered customer growth platform that provides:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI chat assistant for website lead capture</li>
            <li>Automated follow-up sequences via SMS and email</li>
            <li>Appointment booking and reminder management</li>
            <li>Google review request automation</li>
            <li>Business analytics dashboard</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Account registration</h2>
          <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorised access. One account per business entity unless otherwise agreed.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Subscription and billing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All plans include a 14-day free trial</li>
            <li>After the trial, your chosen plan will be billed monthly via Stripe</li>
            <li>Prices are in GBP and exclude VAT where applicable</li>
            <li>You can cancel your subscription at any time via the billing portal</li>
            <li>Cancellations take effect at the end of the current billing period</li>
            <li>No refunds are provided for partial months</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for unlawful purposes or to send spam</li>
            <li>Violate any applicable laws, including GDPR and PECR</li>
            <li>Attempt to access other users&apos; accounts or data</li>
            <li>Reverse-engineer, decompile, or disassemble the Service</li>
            <li>Use the AI assistant to generate harmful, misleading, or illegal content</li>
            <li>Send unsolicited SMS or email messages without proper consent</li>
            <li>Exceed the usage limits of your subscription plan</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Data and content</h2>
          <p>You retain ownership of all data you input into the Service. By using the Service, you grant us a limited licence to process your data as necessary to provide the Service. We process data in accordance with our <a href="/privacy" className="text-[#6c3cff]">Privacy Policy</a>.</p>
          <p>You are responsible for ensuring you have proper consent to collect and process your customers&apos; personal data via the chat widget.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">7. AI-generated content</h2>
          <p>The AI chat assistant generates responses based on the information you provide. While we strive for accuracy, AI responses may occasionally contain errors. You are responsible for reviewing and monitoring the AI&apos;s interactions with your customers. We are not liable for any damages resulting from AI-generated responses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">8. SMS and email communications</h2>
          <p>You are responsible for ensuring compliance with UK telecommunications regulations (PECR) when using our SMS and email features. All recipients must have given appropriate consent. You must honour opt-out requests promptly (our system processes STOP automatically).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">9. Limitation of liability</h2>
          <p>To the maximum extent permitted by law, Zypflow shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits, data, or business opportunities. Our total liability shall not exceed the amount you have paid us in the 12 months preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">10. Service availability</h2>
          <p>We aim for 99.9% uptime but do not guarantee uninterrupted service. We may perform scheduled maintenance with reasonable notice. We are not liable for downtime caused by third-party services (Stripe, Twilio, etc.).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">11. Termination</h2>
          <p>We may suspend or terminate your account if you violate these terms. Upon termination, your data will be deleted within 90 days unless required by law. You may cancel your account at any time via the dashboard.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">12. Changes to terms</h2>
          <p>We may update these terms from time to time. Material changes will be communicated via email at least 30 days in advance. Continued use of the Service after changes take effect constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">13. Governing law</h2>
          <p>These terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">14. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:hello@zypflow.com" className="text-[#6c3cff]">hello@zypflow.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
