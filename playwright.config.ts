import { defineConfig, devices } from '@playwright/test';

const port = 3211;
const appUrl = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: appUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `node scripts/start-e2e-dev.mjs`,
    url: appUrl,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      PORT: String(port),
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      NEXT_PUBLIC_APP_URL: appUrl,
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
      STRIPE_STARTER_PRICE_ID: 'price_placeholder',
      STRIPE_GROWTH_PRICE_ID: 'price_placeholder',
      STRIPE_ENTERPRISE_PRICE_ID: 'price_placeholder',
      TWILIO_ACCOUNT_SID: 'ACplaceholder',
      TWILIO_AUTH_TOKEN: 'auth_placeholder',
      TWILIO_PHONE_NUMBER: '+440000000000',
      RESEND_API_KEY: 're_placeholder',
      OPENAI_API_KEY: 'sk-placeholder-for-e2e',
      ANTHROPIC_API_KEY: 'sk-ant-placeholder-for-e2e',
      AUTOMATION_SECRET: 'automation-secret-placeholder',
      CRON_SECRET: 'cron-secret-placeholder',
      ZYPFLOW_LOCAL_MODE: '1',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
