import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export type CalBookingPayload = {
  attendees: Array<{ email?: string; name?: string }>;
  metadata?: { orgId?: string };
  title?: string;
  startTime: string;
  endTime?: string;
};

type HandleBookingInput = {
  payload: CalBookingPayload;
};

type VerifyCalWebhookInput = {
  rawBody: string;
  signature: string | null;
  secret: string | undefined;
};

export function verifyCalWebhookSignature({ rawBody, signature, secret }: VerifyCalWebhookInput): boolean {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length != expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function handleBookingCreatedWebhook({ payload }: HandleBookingInput): Promise<void> {
  const orgId = payload.metadata?.orgId;

  if (!orgId) {
    throw new Error('BOOKING_ORG_ID_MISSING');
  }

  const attendee = payload.attendees[0] ?? {};
  const email = attendee.email ?? null;
  const name = attendee.name ?? null;
  const service = payload.title ?? 'Consultation';

  const startDate = new Date(payload.startTime);
  const endDate = payload.endTime ? new Date(payload.endTime) : null;
  const durationMinutes = endDate
    ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
    : null;

  let leadId: string | null = null;

  if (email) {
    try {
      const { data: existingLead, error: existingLeadError } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('org_id', orgId)
        .eq('email', email)
        .maybeSingle();

      if (existingLeadError) {
        throw existingLeadError;
      }

      if (existingLead) {
        leadId = existingLead.id;

        const { error: updateLeadError } = await supabaseAdmin
          .from('leads')
          .update({ status: 'booked' })
          .eq('id', leadId);

        if (updateLeadError) {
          throw updateLeadError;
        }
      } else {
        const { data: createdLead, error: createLeadError } = await supabaseAdmin
          .from('leads')
          .insert({
            org_id: orgId,
            name,
            email,
            source: 'booking',
            status: 'booked',
            score: 85,
          })
          .select('id')
          .single();

        if (createLeadError) {
          throw createLeadError;
        }

        leadId = createdLead?.id ?? null;
      }
    } catch (error) {
      console.error('Failed to upsert booking lead:', error);
      throw new Error('BOOKING_LEAD_UPSERT_FAILED');
    }
  }

  try {
    const { error: appointmentError } = await supabaseAdmin.from('appointments').insert({
      org_id: orgId,
      lead_id: leadId,
      service,
      datetime: payload.startTime,
      duration_minutes: durationMinutes,
      status: 'confirmed',
    });

    if (appointmentError) {
      throw appointmentError;
    }
  } catch (error) {
    console.error('Failed to create appointment from Cal.com booking webhook:', error);
    throw new Error('BOOKING_APPOINTMENT_INSERT_FAILED');
  }
}
