export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-brand-purple" />
        <p className="text-sm text-[var(--app-text-soft)]">Loading...</p>
      </div>
    </div>
  );
}
