import { expect, test } from '@playwright/test';

test('homepage renders the premium commercial sections', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'The clinic revenue system that makes your front desk feel faster, calmer, and harder to outgrow.',
    })
  ).toBeVisible();
  await expect(page.getByTestId('audit-intro-heading')).toHaveText(
    'Show the clinic what is leaking before asking them to trust a new system.'
  );
  await expect(page.getByText('Why this feels like a product, not a patchwork')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Not another booking platform' })).toBeVisible();
  await expect(page.getByTestId('hero-offer-link')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run My Revenue Leak Audit' })).toBeVisible();
});

test('public navigation takes buyers through the main conversion path', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('hero-offer-link').click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByText(/Plus .*495 setup \| 60-day minimum/)).toBeVisible();

  await page.getByRole('link', { name: 'Approved clinics log in' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('theme toggle persists across navigation', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('theme-toggle').first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('zypflow-theme')))
    .toBe('dark');

  await page.goto('/pricing');
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('protected routes redirect unauthenticated users to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
});

test('landing audit form shows custom validation errors', async ({ page }) => {
  await page.goto('/');

  const form = page.getByTestId('audit-form');
  await form.getByRole('button', { name: 'Run My Revenue Leak Audit' }).click();
  await expect(page.getByTestId('audit-form-error')).toHaveText('Enter your name.');

  await form.getByPlaceholder('Your name').fill('Alex');
  await form.getByPlaceholder('Clinic name').fill('Zypflow Clinic');
  await form.getByPlaceholder('Clinic website').fill('not-a-url');
  await form.getByPlaceholder('Email address').fill('owner@example.com');
  await form.getByRole('button', { name: 'Run My Revenue Leak Audit' }).click();
  await expect(page.getByTestId('audit-form-error')).toHaveText('Enter a valid website URL.');

  await form.getByPlaceholder('Clinic website').fill('https://zypflowclinic.co.uk');
  await form.getByPlaceholder('Email address').fill('not-an-email');
  await form.getByRole('button', { name: 'Run My Revenue Leak Audit' }).click();
  await expect(page.getByTestId('audit-form-error')).toHaveText('Enter a valid email address.');
});

test('landing audit form trims payload before submit', async ({ page }) => {
  let capturedPayload: Record<string, string> | null = null;

  await page.route('**/api/audits', async (route) => {
    capturedPayload = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto('/');

  const form = page.getByTestId('audit-form');
  await form.getByPlaceholder('Your name').fill('  Alex  ');
  await form.getByPlaceholder('Clinic name').fill('  Zypflow Clinic  ');
  await form.getByPlaceholder('Clinic website').fill('  zypflowclinic.co.uk  ');
  await form.getByPlaceholder('Email address').fill('  ALEX@EXAMPLE.COM  ');
  await form.getByPlaceholder('Phone (optional)').fill('  +44 7700 900000  ');
  await form.getByRole('button', { name: 'Run My Revenue Leak Audit' }).click();

  await expect(form).toContainText("We're opening your Revenue Leak Audit now.");
  expect(capturedPayload).toEqual({
    name: 'Alex',
    business: 'Zypflow Clinic',
    website: 'https://zypflowclinic.co.uk',
    email: 'alex@example.com',
    phone: '+44 7700 900000',
    source: 'revenue_leak_audit',
  });
});

test('landing audit form redirects to the generated report when available', async ({ page }) => {
  await page.route('**/api/audits', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, reportPath: '/pricing?demo-report=1' }),
    });
  });

  await page.goto('/');

  const form = page.getByTestId('audit-form');
  await form.getByPlaceholder('Your name').fill('Alex');
  await form.getByPlaceholder('Clinic name').fill('Zypflow Clinic');
  await form.getByPlaceholder('Clinic website').fill('https://zypflowclinic.co.uk');
  await form.getByPlaceholder('Email address').fill('owner@example.com');
  await form.getByRole('button', { name: 'Run My Revenue Leak Audit' }).click();

  await expect(page).toHaveURL(/\/pricing\?demo-report=1$/);
});

test('pricing page shows the founding pilot details', async ({ page }) => {
  await page.goto('/pricing');

  await expect(
    page.getByRole('heading', {
      name: 'The founding pilot for clinics that want a tighter revenue system, not more software admin.',
    })
  ).toBeVisible();
  await expect(page.getByText(/995\/mo/)).toBeVisible();
  await expect(page.getByText(/Plus .*495 setup \| 60-day minimum/)).toBeVisible();
  await expect(page.getByText('Not included in the first release')).toBeVisible();
  await expect(page.getByText('The commercial questions that matter before launch.')).toBeVisible();
});

test('widget experience shows branded quick prompts and chat replies', async ({ page }) => {
  await page.route('**/api/widget/info?orgId=demo-clinic', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Luna Aesthetics',
        industry: 'aesthetics',
        ai_personality: 'luxury and sophisticated',
        brandColor: '#d26645',
        logoUrl: null,
        bookingUrl: 'https://example.com/book',
        services: [{ name: 'Botox' }, { name: 'Dermal Filler' }],
      }),
    });
  });

  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: 'We offer Botox, filler, and skin treatments. The best next step is a consultation.',
        conversationId: 'demo-conversation',
        leadId: 'demo-lead',
      }),
    });
  });

  await page.goto('/widget/demo-clinic');

  await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
  await expect(page.getByText('Welcome to Luna Aesthetics')).toBeVisible();
  await expect(page.getByText('This assistant is AI-powered.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book now' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'What treatments do you offer?' })).toBeVisible();

  await page.getByRole('button', { name: 'What treatments do you offer?' }).click();
  await expect(
    page.getByText(
      'We offer Botox, filler, and skin treatments. The best next step is a consultation.'
    )
  ).toBeVisible();
});

test('widget handles chat failures gracefully', async ({ page }) => {
  await page.route('**/api/widget/info?orgId=fail-clinic', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Failover Clinic',
        industry: 'dental',
        ai_personality: 'professional and formal',
        brandColor: '#d26645',
        logoUrl: null,
        bookingUrl: 'https://example.com/book',
        services: [{ name: 'Check-up' }],
      }),
    });
  });

  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'boom' }),
    });
  });

  await page.goto('/widget/fail-clinic');
  await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
  await page.getByPlaceholder('Type a message...').fill('Can I book?');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Sorry, something went wrong. Please try again.')).toBeVisible();
});

test('legal pages use the premium public framing', async ({ page }) => {
  await page.goto('/privacy');
  await expect(
    page.getByRole('heading', { name: 'How Zypflow handles clinic, lead, and patient data.' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Approved clinics log in' })).toBeVisible();

  await page.goto('/terms');
  await expect(
    page.getByRole('heading', {
      name: 'The commercial and operating terms behind the Zypflow platform.',
    })
  ).toBeVisible();
  await expect(page.getByText('managed automation platform for private clinics')).toBeVisible();
});

test('health endpoint exposes structured diagnostics', async ({ page }) => {
  const response = await page.request.get('/api/health');
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload).toHaveProperty('status');
  expect(payload).toHaveProperty('summary');
  expect(payload).toHaveProperty('timestamp');
  expect(payload).toHaveProperty('mode');
});

test('signup keeps the CTA disabled until terms are accepted and shows password validation', async ({
  page,
}) => {
  await page.goto('/signup');

  await expect(page.getByText('Create your clinic workspace')).toBeVisible();
  const submit = page.getByRole('button', { name: 'Create Clinic Workspace' });
  await expect(submit).toBeDisabled();

  await page.getByPlaceholder('e.g. Bright Smile Dental').fill('Zypflow Clinic');
  await page.getByPlaceholder('you@yourbusiness.com').fill('owner@example.com');
  await page.getByPlaceholder('Minimum 8 characters').fill('short');
  await page.getByRole('checkbox').check();
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
});

test('forgot password validates email format before submit', async ({ page }) => {
  await page.goto('/forgot-password');

  await page.getByPlaceholder('you@example.com').fill('bad-email');
  await page.getByRole('button', { name: 'Send Reset Link' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

test('reset password catches mismatched passwords', async ({ page }) => {
  await page.goto('/reset-password');

  await page.locator('input[type="password"]').first().fill('StrongPass1!');
  await page.locator('input[type="password"]').nth(1).fill('DifferentPass1!');
  await page.getByRole('button', { name: 'Update Password' }).click();

  await expect(page.getByText('Passwords do not match.')).toBeVisible();
});
