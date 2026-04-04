'use client';

interface CreditUsageBarProps {
  label: string;
  used: number;
  limit: number;
  type: 'scraping' | 'email' | 'ai';
}

const TYPE_ICONS: Record<CreditUsageBarProps['type'], JSX.Element> = {
  scraping: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  email: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  ai: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

function getBarColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500';
  if (pct > 85) return 'bg-red-400';
  if (pct > 60) return 'bg-amber-400';
  return 'bg-green-500';
}

function getTrackColor(pct: number): string {
  if (pct >= 100) return 'bg-red-100';
  if (pct > 85) return 'bg-red-50';
  if (pct > 60) return 'bg-amber-50';
  return 'bg-green-50';
}

function getTextColor(pct: number): string {
  if (pct >= 100) return 'text-red-600';
  if (pct > 85) return 'text-red-500';
  if (pct > 60) return 'text-amber-600';
  return 'text-gray-500';
}

export function CreditUsageBar({ label, used, limit, type }: CreditUsageBarProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;
  const isAtLimit = used >= limit;
  const isWarning = pct > 85 && !isAtLimit;

  const barColor = getBarColor(pct);
  const trackColor = getTrackColor(pct);
  const textColor = getTextColor(pct);

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
          <span className="flex-shrink-0">{TYPE_ICONS[type]}</span>
          <span className="text-xs font-medium truncate">{label}</span>
        </div>
        <div className={`flex items-center gap-1 flex-shrink-0 ${textColor}`}>
          {(isWarning || isAtLimit) && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          )}
          <span className="text-[11px] font-medium">
            {isAtLimit ? 'Limit reached' : `${used.toLocaleString()}/${limit.toLocaleString()} used`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-1.5 w-full rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
