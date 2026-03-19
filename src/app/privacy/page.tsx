export const metadata = {
  title: 'Privacy Policy — Zypflow',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <nav className="flex items-center justify-between mb-10">
        <a href="/" className="text-xl font-bold hover:opacity-80 transition">
          <span className="text-[#6c3cff]">Zyp</span>flow
        </a>
        <div className="flex gap-4 text-sm">
          <a href="/terms" className="text-gray-500 hover:text-gray-900">Terms</a>
          <a href="/login" className="text-[#6c3cff] hover:underline font-medium">Log In</a>
        </div>
      </nav>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: 19 March 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Who we are</h2>
          <p>Zypflow (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an AI-powered customer growth platform for UK service businesses. Our registered address is available upon request. For data protection queries, contact us at <a href="mailto:hello@zypflow.com" className="text-[#6c3cff]">hello@zypflow.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. What data we collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> name, email, phone number, business name when you sign up</li>
            <li><strong>Customer lead data:</strong> name, email, phone, service interest captured via the chat widget on your website</li>
            <li><strong>Conversation data:</strong> messages exchanged with the AI chat assistant</li>
            <li><strong>Payment data:</strong> processed securely by Stripe — we never store card numbers</li>
            <li><strong>Usage data:</strong> pages visited, features used, collected via PostHog analytics</li>
            <li><strong>Device data:</strong> IP address, browser type, operating system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and maintain the Zypflow platform</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send appointment reminders and follow-up messages via SMS and email</li>
            <li>To improve our AI assistant and platform features</li>
            <li>To send service-related communications</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Legal basis for processing (GDPR)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract:</strong> processing necessary to provide our services</li>
            <li><strong>Legitimate interest:</strong> analytics, security, and service improvements</li>
            <li><strong>Consent:</strong> marketing communications (you can opt out at any time)</li>
            <li><strong>Legal obligation:</strong> tax, accounting, and regulatory requirements</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Third-party services</h2>
          <p>We share data with the following trusted processors:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> (EU) — database hosting</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Twilio</strong> — SMS messaging</li>
            <li><strong>Resend</strong> — email delivery</li>
            <li><strong>OpenAI / Anthropic</strong> — AI conversation processing</li>
            <li><strong>Vercel</strong> — application hosting</li>
            <li><strong>PostHog</strong> — product analytics</li>
            <li><strong>Sentry</strong> — error tracking</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Data retention</h2>
          <p>We retain your data for as long as your account is active. If you cancel your subscription, we delete your data within 90 days unless required by law to retain it longer. Lead data captured via the chat widget is retained for the duration of your subscription.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">7. Your rights</h2>
          <p>Under GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Restrict or object to processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:hello@zypflow.com" className="text-[#6c3cff]">hello@zypflow.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">8. Cookies</h2>
          <p>We use essential cookies for authentication and analytics cookies (PostHog, Google Analytics) to understand how you use our platform. You can manage cookie preferences via the cookie consent banner shown on first visit.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">9. SMS opt-out</h2>
          <p>You can opt out of SMS messages at any time by replying STOP to any message. We will immediately cease sending SMS communications.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">10. Changes to this policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via email or through the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">11. Contact</h2>
          <p>For any privacy-related questions, contact us at <a href="mailto:hello@zypflow.com" className="text-[#6c3cff]">hello@zypflow.com</a>.</p>
          <p>If you are unsatisfied with our response, you have the right to lodge a complaint with the <a href="https://ico.org.uk" className="text-[#6c3cff]" target="_blank" rel="noopener noreferrer">Information Commissioner&apos;s Office (ICO)</a>.</p>
        </section>
      </div>
    </div>
  );
}
