import { z } from 'zod';

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
