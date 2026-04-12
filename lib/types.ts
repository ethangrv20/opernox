export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface IGAccount {
  id: string;
  user_id: string;
  name: string;
  adspower_id: string;
  proxy_host?: string;
  proxy_port?: string;
  proxy_user?: string;
  proxy_pass?: string;
  warmup_start_date?: string;
  daily_limit: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  account_id: string;
  message_template: string;
  ai_persona?: string;
  goal?: string;
  escalation_keywords?: string[];
  offer_summary?: string;
  active: boolean;
  leads_count?: number;
  sent_count?: number;
  replies_count?: number;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  campaign_id: string;
  username: string;
  status: 'pending' | 'sent' | 'no_dm_access' | 'escalated' | 'replied';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SentMessage {
  id: string;
  user_id: string;
  account_id: string;
  campaign_id: string;
  username: string;
  message: string;
  success: boolean;
  error?: string;
  sent_at: string;
}

export interface Reply {
  id: string;
  user_id: string;
  account_id: string;
  campaign_id: string;
  from_username: string;
  message: string;
  ai_response?: string;
  status: 'new' | 'replied' | 'escalated' | 'ignored';
  received_at: string;
}
