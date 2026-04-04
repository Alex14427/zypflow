import Link from 'next/link';
import { DashboardConversation } from '@/types/dashboard';
import { DashboardSection, SectionEmptyState } from '@/components/dashboard/dashboard-section';

export function ConversationsPreview({ conversations }: { conversations: DashboardConversation[] }) {
  return (
    <DashboardSection
      title="Conversations"
      description="Latest customer messages and activity."
      action={
        <Link
          href="/dashboard/conversations"
          className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] transition hover:border-brand-purple hover:text-brand-purple"
        >
          Open inbox
        </Link>
      }
    >
      {conversations.length === 0 ? (
        <SectionEmptyState
          title="No live conversations yet."
          message="Customer chats, web enquiries, and SMS follow-ups will land here once the widget and reply flows are live."
          action={
            <Link
              href="/dashboard/templates"
              className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
            >
              Review reply automation
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--app-border)]">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="px-5 py-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--app-text)]">{conversation.leadName}</p>
                <span className="rounded-full bg-[var(--app-muted)] px-2 py-0.5 text-xs capitalize text-[var(--app-text-muted)]">
                  {conversation.channel}
                </span>
              </div>
              <p className="text-xs text-[var(--app-text-muted)]">{conversation.leadContact}</p>
              <p className="mt-1 truncate text-sm text-[var(--app-text)]">{conversation.lastMessage}</p>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
