'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentPlan: string;
  requiredPlan?: string;
}

const PLAN_FEATURES: Record<string, { scraping: string; emails: string; ai: string; price: string }> = {
  starter: {
    scraping: '100 leads/mo',
    emails: '500 emails/mo',
    ai: '20 AI gens/mo',
    price: '£49/mo',
  },
  growth: {
    scraping: '500 leads/mo',
    emails: '5,000 emails/mo',
    ai: '100 AI gens/mo',
    price: '£149/mo',
  },
  agency: {
    scraping: 'Unlimited leads',
    emails: '50,000 emails/mo',
    ai: 'Unlimited AI',
    price: '£349/mo',
  },
};

function getPlanBodyText(feature: string, currentPlan: string): string {
  const plan = currentPlan.toLowerCase();
  if (plan === 'starter') {
    return `You've hit the Starter plan limit for ${feature}. Upgrade to Growth or Agency to keep going without interruption.`;
  }
  if (plan === 'growth') {
    return `Your Growth plan doesn't include unlimited ${feature}. Upgrade to Agency for unrestricted access across all features.`;
  }
  return `Unlock ${feature} by upgrading your plan. Choose the tier that fits your business needs.`;
}

function getHighlightPlan(currentPlan: string, requiredPlan?: string): string {
  if (requiredPlan) return requiredPlan.toLowerCase();
  const plan = currentPlan.toLowerCase();
  if (plan === 'starter') return 'growth';
  return 'agency';
}

export function UpgradeModal({ isOpen, onClose, feature, currentPlan, requiredPlan }: UpgradeModalProps) {
  const highlightPlan = getHighlightPlan(currentPlan, requiredPlan);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const plans = Object.entries(PLAN_FEATURES);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Lock icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-purple flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Upgrade to unlock {feature}
        </h2>

        {/* Body */}
        <p className="text-sm text-gray-500 text-center mb-6">
          {getPlanBodyText(feature, currentPlan)}
        </p>

        {/* Plan comparison mini-table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          {/* Header row */}
          <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Feature</div>
            {plans.map(([planKey, planData]) => (
              <div
                key={planKey}
                className={`px-3 py-2 text-center ${
                  planKey === highlightPlan
                    ? 'bg-brand-purple text-white'
                    : 'text-gray-700'
                }`}
              >
                <div className="text-xs font-bold capitalize">{planKey}</div>
                <div className={`text-[10px] font-medium ${planKey === highlightPlan ? 'text-white/80' : 'text-gray-400'}`}>
                  {planData.price}
                </div>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {[
            { label: 'Leads', key: 'scraping' as const },
            { label: 'Emails', key: 'emails' as const },
            { label: 'AI', key: 'ai' as const },
          ].map(({ label, key }, rowIdx) => (
            <div
              key={key}
              className={`grid grid-cols-4 ${rowIdx < 2 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="px-3 py-2 text-xs text-gray-500 font-medium">{label}</div>
              {plans.map(([planKey, planData]) => (
                <div
                  key={planKey}
                  className={`px-3 py-2 text-center text-xs ${
                    planKey === highlightPlan
                      ? 'bg-purple-50 text-brand-purple font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  {planData[key]}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-sm font-semibold py-3 rounded-xl text-center transition"
          >
            View Plans
          </Link>
          <button
            onClick={onClose}
            className="w-full border border-gray-300 hover:border-gray-400 text-gray-600 text-sm font-medium py-3 rounded-xl transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
