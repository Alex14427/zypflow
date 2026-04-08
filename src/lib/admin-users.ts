const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'alex@zypflow.co.uk')
  .split(',')
  .map((e) => e.trim().toLowerCase());

const ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? ADMIN_EMAILS[0];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export { ADMIN_EMAILS, ALERT_EMAIL };
