export interface DashboardLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number;
  source: string | null;
  createdAt: string;
}

export interface DashboardConversation {
  id: string;
  leadName: string;
  leadContact: string;
  channel: string;
  lastMessage: string;
  updatedAt: string;
}

export interface DashboardAppointment {
  id: string;
  service: string;
  datetime: string;
  status: string;
  leadName: string;
}

export interface DashboardReviewsSummary {
  requestsSent: number;
  completed: number;
  averageRating: number | null;
  completionRate: number;
}

export interface DashboardData {
  businessName: string;
  leads: DashboardLead[];
  conversations: DashboardConversation[];
  appointments: DashboardAppointment[];
  reviews: DashboardReviewsSummary;
}
