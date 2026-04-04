import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const envFile = join(cwd, '.env.local');
const envMap = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
const baseUrl = envMap.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
const cronSecret = envMap.CRON_SECRET || 'local-cron-secret';
const smokeEnv = buildSmokeEnv();

const publicRoutes = [
  '/',
  '/pricing',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/widget/local-smoke-clinic',
];
const protectedRoutes = ['/dashboard', '/admin'];
const cronRoutes = [
  '/api/outreach/cron',
  '/api/automations/lifecycle',
  '/api/automations/reminders',
  '/api/automations/follow-up',
  '/api/automations/review-request',
];

let serverProcess = null;
let spawnedServer = false;

try {
  if (!(await isReachable(baseUrl))) {
    spawnedServer = true;
    serverProcess = startServer();
    await waitForServer(baseUrl, 240_000);
  }

  const results = [];

  for (const route of publicRoutes) {
    results.push(await checkPublicRoute(baseUrl, route));
  }

  for (const route of protectedRoutes) {
    results.push(await checkProtectedRoute(baseUrl, route));
  }

  results.push(await checkHealthRoute(baseUrl));

  for (const route of cronRoutes) {
    results.push(await checkCronRoute(baseUrl, route, cronSecret));
  }

  results.push(await checkAiGeneratePrompt(baseUrl));
  results.push(await checkAiSuggestReplies(baseUrl));
  results.push(await checkAiExtractBusiness(baseUrl));

  printResults(results);

  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  if (spawnedServer && serverProcess) {
    await stopServer(serverProcess);
  }
}

function parseEnv(contents) {
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    env[key] = value;
  }
  return env;
}

function buildSmokeEnv() {
  return {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || envMap.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envMap.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || envMap.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || baseUrl,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || envMap.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET:
      process.env.STRIPE_WEBHOOK_SECRET || envMap.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      envMap.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      'pk_test_placeholder',
    STRIPE_STARTER_PRICE_ID:
      process.env.STRIPE_STARTER_PRICE_ID || envMap.STRIPE_STARTER_PRICE_ID || 'price_placeholder',
    STRIPE_GROWTH_PRICE_ID:
      process.env.STRIPE_GROWTH_PRICE_ID || envMap.STRIPE_GROWTH_PRICE_ID || 'price_placeholder',
    STRIPE_ENTERPRISE_PRICE_ID:
      process.env.STRIPE_ENTERPRISE_PRICE_ID || envMap.STRIPE_ENTERPRISE_PRICE_ID || 'price_placeholder',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || envMap.TWILIO_ACCOUNT_SID || 'ACplaceholder',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || envMap.TWILIO_AUTH_TOKEN || 'auth_placeholder',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || envMap.TWILIO_PHONE_NUMBER || '+440000000000',
    RESEND_API_KEY: process.env.RESEND_API_KEY || envMap.RESEND_API_KEY || 're_placeholder',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || envMap.OPENAI_API_KEY || 'sk-placeholder-for-smoke',
    ANTHROPIC_API_KEY:
      process.env.ANTHROPIC_API_KEY || envMap.ANTHROPIC_API_KEY || 'sk-ant-placeholder-for-smoke',
    AUTOMATION_SECRET:
      process.env.AUTOMATION_SECRET || envMap.AUTOMATION_SECRET || 'automation-secret-placeholder',
    CRON_SECRET: process.env.CRON_SECRET || envMap.CRON_SECRET || cronSecret,
    ZYPFLOW_LOCAL_MODE: process.env.ZYPFLOW_LOCAL_MODE || envMap.ZYPFLOW_LOCAL_MODE || '1',
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
  };
}

function startServer() {
  clearNextArtifacts();

  const command = process.platform === 'win32' ? 'cmd.exe' : 'sh';
  const args = process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'build', '&&', 'npm', 'run', 'start', '--', '--hostname', '127.0.0.1', '--port', '3000']
    : ['-c', 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3000'];

  const child = spawn(command, args, {
    cwd,
    env: smokeEnv,
    stdio: 'inherit',
  });

  return child;
}

function clearNextArtifacts() {
  const nextDir = join(cwd, '.next');
  if (existsSync(nextDir)) {
    rmSync(nextDir, { recursive: true, force: true });
  }
}

async function stopServer(child) {
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  child.kill('SIGTERM');
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isReachable(url)) return;
    await sleep(1500);
  }
  throw new Error(`Timed out waiting for local server at ${url}`);
}

async function isReachable(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function checkPublicRoute(base, route) {
  let response = await fetch(`${base}${route}`, { redirect: 'manual' });
  for (let attempt = 0; attempt < 3 && (response.status === 404 || response.status >= 500); attempt++) {
    await sleep(1000 * (attempt + 1));
    response = await fetch(`${base}${route}`, { redirect: 'manual' });
  }
  return {
    name: `GET ${route}`,
    ok: response.status === 200,
    detail: `status ${response.status}`,
  };
}

async function checkProtectedRoute(base, route) {
  const response = await fetch(`${base}${route}`, { redirect: 'manual' });
  const location = response.headers.get('location') || '';
  const ok = response.status === 307 && location.includes('/login');
  return {
    name: `GET ${route}`,
    ok,
    detail: `status ${response.status}${location ? ` -> ${location}` : ''}`,
  };
}

async function checkHealthRoute(base) {
  const response = await fetch(`${base}/api/health`);
  const payload = await response.json().catch(() => ({}));
  const ok = response.status === 200 && ['healthy', 'local_smoke', 'degraded'].includes(payload.status);
  return {
    name: 'GET /api/health',
    ok,
    detail: `status ${response.status} (${payload.status || 'unknown'})`,
  };
}

async function checkCronRoute(base, route, secret) {
  const response = await fetch(`${base}${route}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const payload = await response.json().catch(() => ({}));
  return {
    name: `GET ${route}`,
    ok: response.status === 200,
    detail: `status ${response.status}${payload.reason ? ` - ${payload.reason}` : ''}`,
  };
}

async function checkAiGeneratePrompt(base) {
  const response = await fetch(`${base}/api/ai/generate-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mayfair Skin Studio',
      industry: 'Aesthetics',
      personality: 'luxury and sophisticated',
      services: [{ name: 'Skin consultation', price: 'GBP 75' }],
      faqs: [{ question: 'Do you offer consultations?', answer: 'Yes, all new clients start with a consultation.' }],
      bookingUrl: `${base}/pricing`,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    name: 'POST /api/ai/generate-prompt',
    ok: response.status === 200 && typeof payload.prompt === 'string' && payload.prompt.length > 20,
    detail: `status ${response.status}`,
  };
}

async function checkAiSuggestReplies(base) {
  const response = await fetch(`${base}/api/ai/suggest-replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadName: 'Ella',
      businessName: 'Mayfair Skin Studio',
      service: 'consultation',
      messages: [
        { role: 'user', content: 'Hi, do you have any consultation slots this week?' },
      ],
    }),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    name: 'POST /api/ai/suggest-replies',
    ok: response.status === 200 && Array.isArray(payload.suggestions) && payload.suggestions.length === 3,
    detail: `status ${response.status}`,
  };
}

async function checkAiExtractBusiness(base) {
  const response = await fetch(`${base}/api/ai/extract-business`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: base }),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    name: 'POST /api/ai/extract-business',
    ok: response.status === 200 && payload.success === true && payload.data && typeof payload.data.name === 'string',
    detail: `status ${response.status}`,
  };
}

function printResults(results) {
  console.log('\nLocal smoke results\n');
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}  ${result.detail}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
