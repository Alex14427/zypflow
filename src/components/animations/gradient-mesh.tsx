'use client';

/**
 * Animated gradient mesh background.
 * CSS-only — no JS runtime cost.
 */
export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className || ''}`} aria-hidden="true">
      <div className="absolute -left-[20%] -top-[20%] h-[60%] w-[60%] animate-mesh-1 rounded-full bg-brand-purple/[0.06] blur-[120px]" />
      <div className="absolute -right-[15%] top-[10%] h-[50%] w-[50%] animate-mesh-2 rounded-full bg-[#a855f7]/[0.05] blur-[100px]" />
      <div className="absolute bottom-[5%] left-[25%] h-[45%] w-[45%] animate-mesh-3 rounded-full bg-teal-500/[0.04] blur-[100px]" />
    </div>
  );
}
