import twilio from 'twilio';
import { canUseTwilio, isLocalSmokeMode } from '@/lib/local-mode';

export type SendSmsInput = {
  to: string;
  body: string;
};

function requireEnv(name: 'TWILIO_ACCOUNT_SID' | 'TWILIO_AUTH_TOKEN' | 'TWILIO_PHONE_NUMBER'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

let smsClient: ReturnType<typeof twilio> | null = null;

function getSmsClient() {
  if (smsClient) {
    return smsClient;
  }

  smsClient = twilio(
    requireEnv('TWILIO_ACCOUNT_SID'),
    requireEnv('TWILIO_AUTH_TOKEN')
  );

  return smsClient;
}

export async function sendSms({ to, body }: SendSmsInput): Promise<{ sid: string }> {
  if (isLocalSmokeMode() || !canUseTwilio()) {
    console.info(`[local-sms] ${to}: ${body}`);
    return { sid: `local-sms-${Date.now()}` };
  }

  const client = getSmsClient();
  const from = requireEnv('TWILIO_PHONE_NUMBER');

  const message = await client.messages.create({
    body,
    from,
    to,
  });

  return { sid: message.sid };
}
