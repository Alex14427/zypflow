export default function ConversationsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-gray-200 rounded w-40" />
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border" />
      </div>
    </div>
  );
}
