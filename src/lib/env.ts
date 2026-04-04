import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_GROWTH_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().startsWith('price_'),
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().startsWith('+'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  AUTOMATION_SECRET: z.string().min(16),
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

let cachedEnv: Env | null = null;

type ValidateEnvOptions = {
  strict?: boolean;
};

export function validateEnv(options: ValidateEnvOptions = {}): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  const strict = options.strict ?? process.env.NODE_ENV === 'development';

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`\n[env] Missing or invalid environment variables:\n${missing}\n`);

    if (strict) {
      throw new Error('Invalid environment variables');
    }

    console.error('[env] Running with potentially invalid environment variables. Check deployment settings.');
  }

  cachedEnv = (result.success ? result.data : process.env) as Env;
  return cachedEnv;
}
