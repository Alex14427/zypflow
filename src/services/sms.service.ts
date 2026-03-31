import twilio from 'twilio';

export type SendSmsInput = {
  to: string;
  body: string;
};

export type SendSmsResult = {
  sid: string;
};

class SmsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsConfigurationError';
  }
}

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new SmsConfigurationError('Twilio environment variables are not configured.');
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

function getFromPhoneNumber() {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    throw new SmsConfigurationError('Twilio from phone number is not configured.');
  }

  return fromNumber;
}

export async function sendSms({ to, body }: SendSmsInput): Promise<SendSmsResult> {
  const client = getTwilioClient();
  const from = getFromPhoneNumber();

  const message = await client.messages.create({
    to,
    from,
    body,
  });

  return { sid: message.sid };
}

export function isSmsConfigurationError(error: unknown): error is SmsConfigurationError {
  return error instanceof SmsConfigurationError;
}
