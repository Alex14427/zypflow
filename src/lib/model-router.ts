// ---------------------------------------------------------------------------
// Model Router – picks the right AI model & parameters based on context.
// ---------------------------------------------------------------------------

export type ModelTier = 'premium' | 'standard' | 'cheap';

export interface ModelRouterContext {
  leadScore?: number;
  messageCount?: number;
  isFirstMessage?: boolean;
  channel?: string;
  urgency?: string;
  businessPlan?: string;
}

// ---------------------------------------------------------------------------
// Tier resolution
// ---------------------------------------------------------------------------

export function resolveModelTier(context: ModelRouterContext): ModelTier {
  const { leadScore, messageCount, isFirstMessage, channel, urgency, businessPlan } = context;

  // --- Premium triggers ---
  if (leadScore !== undefined && leadScore >= 70) return 'premium';
  if (isFirstMessage) return 'premium';
  if (urgency === 'high') return 'premium';
  if (channel === 'voice') return 'premium';

  // --- Cheap triggers ---
  if (leadScore !== undefined && leadScore < 30) return 'cheap';
  if (messageCount !== undefined && messageCount > 15) return 'cheap';
  if (businessPlan === 'trial') return 'cheap';

  // --- Everything else ---
  return 'standard';
}

// ---------------------------------------------------------------------------
// Model selection helpers
// ---------------------------------------------------------------------------

const CHAT_MODELS: Record<ModelTier, string> = {
  premium: 'gpt-4o',
  standard: 'gpt-4o',
  cheap: 'claude-haiku-4-5-20251001',
};

const MAX_TOKENS: Record<ModelTier, number> = {
  premium: 600,
  standard: 500,
  cheap: 350,
};

const TEMPERATURES: Record<ModelTier, number> = {
  premium: 0.7,
  standard: 0.7,
  cheap: 0.5,
};

export function getChatModel(tier: ModelTier): string {
  return CHAT_MODELS[tier];
}

export function getMaxTokens(tier: ModelTier): number {
  return MAX_TOKENS[tier];
}

export function getTemperature(tier: ModelTier): number {
  return TEMPERATURES[tier];
}
