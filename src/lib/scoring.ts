export function scoreLead(lead: {
  name?: string; email?: string; phone?: string;
  service_interest?: string; urgency?: string; source?: string;
}): number {
  let score = 0;

  if (lead.name) score += 10;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  if (lead.service_interest) score += 20;

  if (lead.urgency === 'high') score += 30;
  else if (lead.urgency === 'medium') score += 15;
  else if (lead.urgency === 'low') score += 5;

  if (lead.source === 'voice') score += 20;
  else if (lead.source === 'sms') score += 15;
  else if (lead.source === 'chat') score += 10;

  return Math.min(score, 100);
}
