import { canUseAnthropic, canUseOpenAI, canUseResend, canUseTwilio, isLocalSmokeMode } from '@/lib/local-mode';
import { supabaseAdmin } from '@/lib/supabase';

export type SystemCheckStatus = 'healthy' | 'configured' | 'simulated' | 'missing' | 'unhealthy';

export interface SystemCheck {
  key: string;
  label: string;
  status: SystemCheckStatus;
  detail: string;
}

export interface SystemDiagnostics {
  status: 'healthy' | 'degraded' | 'local_smoke';
  timestamp: string;
  summary: string;
  warnings: string[];
  checks: SystemCheck[];
}

function buildCheck(key: string, label: string, status: SystemCheckStatus, detail: string): SystemCheck {
  return { key, label, status, detail };
}

export async function collectSystemDiagnostics(): Promise<SystemDiagnostics> {
  const localMode = isLocalSmokeMode();
  const checks: SystemCheck[] = [];

  try {
    const { error } = await supabaseAdmin.from('businesses').select('id').limit(1);
    checks.push(
      buildCheck(
        'database',
        'Database',
        error ? 'unhealthy' : 'healthy',
        error ? 'Supabase query failed. Check credentials, project status, or network access.' : 'Supabase responded to a lightweight health query.'
      )
    );
  } catch {
    checks.push(buildCheck('database', 'Database', 'unhealthy', 'Supabase query could not be completed.'));
  }

  checks.push(
    buildCheck(
      'localMode',
      'Local smoke mode',
      localMode ? 'simulated' : 'healthy',
      localMode
        ? 'Provider calls are simulated locally. Great for safe testing, but not representative of live production delivery.'
        : 'Live provider mode is enabled.'
    )
  );

  checks.push(
    buildCheck(
      'appUrl',
      'Application URL',
      process.env.NEXT_PUBLIC_APP_URL ? 'configured' : 'missing',
      process.env.NEXT_PUBLIC_APP_URL
        ? `Using ${process.env.NEXT_PUBLIC_APP_URL}`
        : 'NEXT_PUBLIC_APP_URL is missing, so emails, checkout redirects, and widget install code can drift.'
    )
  );

  checks.push(
    buildCheck(
      'cronSecret',
      'Cron secret',
      process.env.CRON_SECRET ? 'configured' : 'missing',
      process.env.CRON_SECRET
        ? 'Scheduled routes can be protected and called safely.'
        : 'CRON_SECRET is missing, so scheduled routes are not production-ready.'
    )
  );

  checks.push(
    buildCheck(
      'automationSecret',
      'Automation secret',
      process.env.AUTOMATION_SECRET ? 'configured' : 'missing',
      process.env.AUTOMATION_SECRET
        ? 'Lifecycle and unsubscribe token generation are secured.'
        : 'AUTOMATION_SECRET is missing, so automation links and unsubscribe security are weaker than they should be.'
    )
  );

  checks.push(
    buildCheck(
      'stripe',
      'Stripe',
      process.env.STRIPE_SECRET_KEY ? (localMode ? 'simulated' : 'configured') : 'missing',
      process.env.STRIPE_SECRET_KEY
        ? localMode
          ? 'Stripe is configured, but local smoke mode is still simulating live billing calls.'
          : 'Stripe keys are present for checkout and subscription billing.'
        : 'Stripe secret key is missing.'
    )
  );

  checks.push(
    buildCheck(
      'resend',
      'Resend',
      canUseResend() ? 'configured' : localMode ? 'simulated' : 'missing',
      canUseResend()
        ? 'Transactional email is configured.'
        : localMode
          ? 'Email sending is being simulated locally.'
          : 'Resend API key is missing.'
    )
  );

  checks.push(
    buildCheck(
      'twilio',
      'Twilio',
      canUseTwilio() ? 'configured' : localMode ? 'simulated' : 'missing',
      canUseTwilio()
        ? 'SMS delivery is configured.'
        : localMode
          ? 'SMS sending is being simulated locally.'
          : 'Twilio credentials are missing.'
    )
  );

  checks.push(
    buildCheck(
      'openai',
      'OpenAI',
      canUseOpenAI() ? 'configured' : localMode ? 'simulated' : 'missing',
      canUseOpenAI()
        ? 'OpenAI provider is available for AI extraction and prompt generation.'
        : localMode
          ? 'AI responses are being simulated locally.'
          : 'OpenAI API key is missing.'
    )
  );

  checks.push(
    buildCheck(
      'anthropic',
      'Anthropic',
      canUseAnthropic() ? 'configured' : localMode ? 'simulated' : 'missing',
      canUseAnthropic()
        ? 'Anthropic provider is available as an additional AI path.'
        : localMode
          ? 'Anthropic calls are being simulated locally.'
          : 'Anthropic API key is missing.'
    )
  );

  const hardFailures = checks.filter((check) => check.status === 'unhealthy' || check.status === 'missing');
  const warnings = checks
    .filter((check) => check.status !== 'healthy' && check.status !== 'configured')
    .map((check) => `${check.label}: ${check.detail}`);

  const status = localMode ? 'local_smoke' : hardFailures.length > 0 ? 'degraded' : 'healthy';
  const summary =
    status === 'healthy'
      ? 'Core production dependencies are configured and responding.'
      : status === 'local_smoke'
        ? 'The system is healthy enough for safe local testing, but several live provider calls are intentionally simulated.'
        : 'Some core dependencies or secrets still need attention before the product should be treated as fully live.';

  return {
    status,
    timestamp: new Date().toISOString(),
    summary,
    warnings,
    checks,
  };
}
