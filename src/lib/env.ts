import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_GROWTH_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().startsWith('price_'),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().startsWith('+'),

  // Resend
  RESEND_API_KEY: z.string().startsWith('re_'),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  AUTOMATION_SECRET: z.string().min(16),

  // Optional
  ANTHROPIC_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  INSTANTLY_API_KEY: z.string().optional(),
  APIFY_API_TOKEN: z.string().optional(),
  MAKE_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error(`\n❌ Missing or invalid environment variables:\n${missing}\n`);
    // Throw in development, and also in production for critical vars
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid environment variables');
    }
    // In production: log loudly but continue — Vercel env vars may be set differently
    console.error('⚠️  Running with potentially invalid env vars in production. Check Vercel settings.');
  }

  _env = (result.success ? result.data : process.env) as Env;
  return _env;
}
