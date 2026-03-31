import { DashboardConversation } from '@/types/dashboard';
import { DashboardSection, SectionEmptyState } from '@/components/dashboard/dashboard-section';

export function ConversationsPreview({ conversations }: { conversations: DashboardConversation[] }) {
  return (
    <DashboardSection title="Conversations" description="Latest customer messages and activity.">
      {conversations.length === 0 ? (
        <SectionEmptyState message="No conversations yet. Customer chats and SMS threads will show here." />
      ) : (
        <ul className="divide-y">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="px-4 py-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{conversation.leadName}</p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
                  {conversation.channel}
                </span>
              </div>
              <p className="text-xs text-gray-500">{conversation.leadContact}</p>
              <p className="mt-1 truncate text-sm text-gray-700">{conversation.lastMessage}</p>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
