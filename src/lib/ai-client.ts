import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Lazy-initialized AI clients — prevents crashes when env vars are missing at build time
let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
  }
  return _openai;
}

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' });
  }
  return _anthropic;
}

/**
 * Model selection strategy:
 * - Customer-facing chat: GPT-4o (best UK English tone) with Claude Sonnet fallback
 * - Business extraction: GPT-4o (complex HTML parsing needs capability)
 * - Reply suggestions: Claude Haiku (simple structured output, 50x cheaper)
 * - Prompt generation: Claude Haiku (following clear instructions, 50x cheaper)
 * - Email personalization: Claude Haiku (template fill, simple task)
 * - Execution log summaries: Claude Haiku (short plain-English summaries)
 */
export const MODELS = {
  /** Customer-facing, must be excellent */
  chat: 'gpt-4o' as const,
  /** Complex HTML → structured JSON extraction */
  extraction: 'gpt-4o' as const,
  /** Fallback for chat when OpenAI is down */
  chatFallback: 'claude-sonnet-4-6' as const,
  /** Simple structured tasks — 50x cheaper than GPT-4o */
  cheap: 'claude-haiku-4-5-20251001' as const,
};
