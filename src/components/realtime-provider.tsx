'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'new_lead' | 'new_message' | 'booking' | 'review';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface RealtimeContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({ orgId, children }: { orgId: string | null; children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounter = useRef(0);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    idCounter.current += 1;
    setNotifications(prev => [
      {
        ...n,
        id: `notif-${idCounter.current}`,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev.slice(0, 49), // Keep last 50
    ]);

    // Browser notification if permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(n.title, { body: n.body, icon: '/favicon.svg' });
    }
  }, []);

  useEffect(() => {
    if (!orgId) return;

    // Request browser notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Subscribe to new leads
    const leadsChannel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        const lead = payload.new as { name?: string; email?: string; score?: number; service_interest?: string };
        addNotification({
          type: 'new_lead',
          title: 'New Lead Captured',
          body: `${lead.name || 'Anonymous'} ${lead.service_interest ? `interested in ${lead.service_interest}` : 'started a conversation'}${lead.score ? ` (Score: ${lead.score})` : ''}`,
          link: '/dashboard/leads',
        });
      })
      .subscribe();

    // Subscribe to new conversations
    const convsChannel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `org_id=eq.${orgId}`,
      }, () => {
        addNotification({
          type: 'new_message',
          title: 'New Message',
          body: 'A customer sent a new message',
          link: '/dashboard/conversations',
        });
      })
      .subscribe();

    // Subscribe to new appointments
    const apptsChannel = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        const appt = payload.new as { service?: string; datetime?: string };
        addNotification({
          type: 'booking',
          title: 'New Booking',
          body: `${appt.service || 'Appointment'} booked for ${appt.datetime ? new Date(appt.datetime).toLocaleDateString('en-GB') : 'soon'}`,
          link: '/dashboard/bookings',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(convsChannel);
      supabase.removeChannel(apptsChannel);
    };
  }, [orgId, addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <RealtimeContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, clearAll }}>
      {children}
    </RealtimeContext.Provider>
  );
}
