import twilio from 'twilio';

export type SendSmsInput = {
  to: string;
  body: string;
};

const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

export async function sendSms({ to, body }: SendSmsInput): Promise<{ sid: string }> {
  const message = await smsClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER || '',
    to,
  });

  return { sid: message.sid };
}
