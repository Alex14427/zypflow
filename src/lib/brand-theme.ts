import type { CSSProperties } from 'react';

export const DEFAULT_BRAND_COLOR = '#d26645';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexChannel(value: number) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
}

function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '').trim();
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  return `#${normalizeHexChannel(rgb.r)}${normalizeHexChannel(rgb.g)}${normalizeHexChannel(rgb.b)}`;
}

function mixRgb(
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  weight: number
) {
  return {
    r: base.r + (target.r - base.r) * weight,
    g: base.g + (target.g - base.g) * weight,
    b: base.b + (target.b - base.b) * weight,
  };
}

function rgba(rgb: { r: number; g: number; b: number }, alpha: number) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function normalizeBrandColor(value?: string | null) {
  const rgb = value ? hexToRgb(value) : null;
  if (!rgb) {
    return DEFAULT_BRAND_COLOR;
  }

  return rgbToHex(rgb).toLowerCase();
}

export function resolveBrandAssets(settings?: Record<string, unknown> | null, widgetColor?: string | null) {
  const brandColor = normalizeBrandColor(
    typeof settings?.brand_color === 'string' ? settings.brand_color : widgetColor
  );
  const brandRgb = hexToRgb(brandColor)!;
  const darker = rgbToHex(mixRgb(brandRgb, { r: 8, g: 15, b: 35 }, 0.18));
  const softer = rgbToHex(mixRgb(brandRgb, { r: 255, g: 255, b: 255 }, 0.88));
  const logoUrl =
    typeof settings?.logo_url === 'string' && settings.logo_url.trim().length > 0
      ? settings.logo_url.trim()
      : null;

  return {
    brandColor,
    brandDark: darker,
    brandSoft: softer,
    logoUrl,
    cssVariables: {
      '--brand-purple': brandColor,
      '--brand-purple-dark': darker,
      '--brand-purple-soft': softer,
      '--app-bg-accent': rgba(brandRgb, 0.16),
      '--app-card-border': rgba(brandRgb, 0.16),
    } as CSSProperties,
  };
}
