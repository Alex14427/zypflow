import { z } from 'zod';
import { DEFAULT_BRAND_COLOR } from '@/lib/brand-theme';

const phoneInputPattern = /^[+\d\s().-]{7,25}$/;

const trimmedRequiredString = (label: string, minimum = 1) =>
  z.string().trim().min(minimum, `${label} is required.`);

export function normalizeUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(normalizeUrlInput(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLikelyPublicWebsite(value: string): boolean {
  try {
    const parsed = new URL(normalizeUrlInput(value));
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .transform((value) => value.toLowerCase());

export const passwordFieldSchema = z.string().min(8, 'Password must be at least 8 characters.');

export const businessNameFieldSchema = z
  .string()
  .trim()
  .min(2, 'Business name must be at least 2 characters.');

export const optionalPhoneFieldSchema = z
  .string()
  .trim()
  .refine((value) => !value || phoneInputPattern.test(value), 'Enter a valid phone number.')
  .transform((value) => value.trim());

export const optionalUrlFieldSchema = z
  .string()
  .trim()
  .refine((value) => !value || isValidHttpUrl(value), 'Enter a valid URL.')
  .transform((value) => normalizeUrlInput(value));

export const signupFormSchema = z
  .object({
    businessName: businessNameFieldSchema,
    email: emailFieldSchema,
    password: passwordFieldSchema,
    acceptedTerms: z.boolean(),
  })
  .refine((data) => data.acceptedTerms, {
    message: 'You must accept the terms to continue.',
    path: ['acceptedTerms'],
  });

export const loginFormSchema = z.object({
  email: emailFieldSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordFormSchema = z.object({
  email: emailFieldSchema,
});

export const resetPasswordFormSchema = z
  .object({
    password: passwordFieldSchema,
    confirm: passwordFieldSchema,
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  });

export const websiteEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  business: businessNameFieldSchema,
  email: emailFieldSchema,
  phone: optionalPhoneFieldSchema.optional().default(''),
  source: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .default('website_audit_form'),
});

export const auditRequestSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  business: businessNameFieldSchema,
  website: z
    .string()
    .trim()
    .min(1, 'Enter your website.')
    .refine((value) => isLikelyPublicWebsite(value), 'Enter a valid website URL.')
    .transform((value) => normalizeUrlInput(value)),
  email: emailFieldSchema,
  phone: optionalPhoneFieldSchema.optional().default(''),
  source: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .default('revenue_leak_audit'),
});

export const businessBasicsSchema = z.object({
  name: businessNameFieldSchema,
  website: optionalUrlFieldSchema,
  phone: optionalPhoneFieldSchema,
  industry: trimmedRequiredString('Industry'),
});

export const bookingLinksSchema = z.object({
  bookingUrl: optionalUrlFieldSchema,
  googleReviewLink: optionalUrlFieldSchema,
});

export const businessSettingsSchema = z.object({
  name: businessNameFieldSchema,
  phone: optionalPhoneFieldSchema,
  website: optionalUrlFieldSchema,
  bookingUrl: optionalUrlFieldSchema,
  googleReviewLink: optionalUrlFieldSchema,
  aiPersonality: trimmedRequiredString('AI personality'),
  brandColor: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Enter a valid hex color.')
    .default(DEFAULT_BRAND_COLOR),
  logoUrl: optionalUrlFieldSchema,
});

export const whatsappConfigSchema = z
  .object({
    phoneNumberId: z.string().trim(),
    accessToken: z.string().trim(),
  })
  .refine(
    (data) => {
      if (!data.phoneNumberId && !data.accessToken) return true;
      return data.phoneNumberId.length >= 6 && data.accessToken.length >= 12;
    },
    {
      message: 'Add both a valid Phone Number ID and Access Token, or leave both blank.',
      path: ['phoneNumberId'],
    }
  );

export const chatInputSchema = z.object({
  orgId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
});

export const smsInputSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{6,14}$/),
  body: z.string().min(1).max(1600),
});

export const checkoutInputSchema = z.object({
  plan: z.enum(['starter', 'growth', 'enterprise']),
  orgId: z.string().uuid(),
  email: z.string().email(),
});


export const calBookingWebhookSchema = z.object({
  payload: z.object({
    attendees: z.array(
      z.object({
        email: z.string().email().optional(),
        name: z.string().min(1).optional(),
      })
    ).default([]),
    metadata: z.object({
      orgId: z.string().uuid(),
    }).optional(),
    title: z.string().min(1).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
  }),
});
