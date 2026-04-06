/**
 * Startup environment variable validation.
 * Warns about missing config early instead of failing at runtime.
 */

type EnvVar = {
  key: string;
  required: boolean;
  group: string;
};

const ENV_VARS: EnvVar[] = [
  // Core (required)
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true, group: 'Supabase' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, group: 'Supabase' },

  // AI (at least one needed)
  { key: 'OPENAI_API_KEY', required: false, group: 'AI' },
  { key: 'ANTHROPIC_API_KEY', required: false, group: 'AI' },

  // Automations
  { key: 'AUTOMATION_SECRET', required: false, group: 'Automations' },
  { key: 'CRON_SECRET', required: false, group: 'Automations' },

  // Billing
  { key: 'STRIPE_SECRET_KEY', required: false, group: 'Billing' },
  { key: 'STRIPE_WEBHOOK_SECRET', required: false, group: 'Billing' },

  // Communication
  { key: 'TWILIO_ACCOUNT_SID', required: false, group: 'SMS' },
  { key: 'RESEND_API_KEY', required: false, group: 'Email' },

  // Rate limiting
  { key: 'UPSTASH_REDIS_REST_URL', required: false, group: 'Rate Limiting' },
];

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    if (!process.env[v.key]) {
      if (v.required) {
        missing.push(`${v.key} (${v.group})`);
      } else {
        warnings.push(`${v.key} (${v.group})`);
      }
    }
  }

  // Check at least one AI key
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    warnings.push('No AI API key set (OPENAI_API_KEY or ANTHROPIC_API_KEY) — chat and audit AI features will fail');
  }

  if (missing.length > 0) {
    console.error(`[env-check] CRITICAL — missing required env vars:\n  ${missing.join('\n  ')}`);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`[env-check] Optional env vars not set:\n  ${warnings.join('\n  ')}`);
  }
}
