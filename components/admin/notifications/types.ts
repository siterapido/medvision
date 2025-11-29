export interface NotificationTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  trigger_type: string;
  active: boolean;
  updated_at: string;
  subject?: string | null;
  channel: "whatsapp" | "email";
}

export interface NotificationLog {
  id: string;
  user_id: string;
  template_id: string | null;
  channel: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  content: string;
  error_message: string | null;
  profiles?: {
    name: string | null;
    email: string | null;
    whatsapp: string | null;
  };
  notification_templates?: {
    name: string;
  } | null;
}
