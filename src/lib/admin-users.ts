const ADMIN_EMAILS = ['alex@zypflow.co.uk'];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export { ADMIN_EMAILS };
