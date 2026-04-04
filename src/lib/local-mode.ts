const PLACEHOLDER_PATTERNS = [
  'missing',
  'test-',
  'local-',
  're_local_',
  'sk-local-',
  'sk_test_local',
  'pk_test_local',
  'whsec_local',
  'price_local',
  'AC00000000000000000000000000000000',
  'https://example.supabase.co',
];

export function isLocalSmokeMode() {
  return process.env.ZYPFLOW_LOCAL_MODE === '1';
}

export function isPlaceholderValue(value?: string | null) {
  if (!value) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => value.startsWith(pattern) || value === pattern);
}

export function hasUsableIntegrationSecret(value?: string | null) {
  return Boolean(value) && !isPlaceholderValue(value);
}

export function canUseResend() {
  return hasUsableIntegrationSecret(process.env.RESEND_API_KEY);
}

export function canUseTwilio() {
  return (
    hasUsableIntegrationSecret(process.env.TWILIO_ACCOUNT_SID) &&
    hasUsableIntegrationSecret(process.env.TWILIO_AUTH_TOKEN) &&
    hasUsableIntegrationSecret(process.env.TWILIO_PHONE_NUMBER)
  );
}

export function canUseOpenAI() {
  return hasUsableIntegrationSecret(process.env.OPENAI_API_KEY);
}

export function canUseAnthropic() {
  return hasUsableIntegrationSecret(process.env.ANTHROPIC_API_KEY);
}

export function canUseSupabaseAdmin() {
  return (
    hasUsableIntegrationSecret(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    hasUsableIntegrationSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    hasUsableIntegrationSecret(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
