// ─────────────────────────────────────────────────────────────
// CRM Types
// ─────────────────────────────────────────────────────────────

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "INTERESTED" | "CONVERTED" | "LOST";
export type LeadTemperature = "COLD" | "WARM" | "HOT";
export type LeadSource =
  | "DIRECT" | "GOOGLE" | "INSTAGRAM" | "FACEBOOK" | "TIKTOK"
  | "WHATSAPP" | "YOUTUBE" | "TV" | "QR_CODE" | "REFERRAL"
  | "EMAIL" | "CAMPAIGN";
export type LeadIntent = "BROWSE" | "RECIPE" | "PURCHASE" | "CATERING" | "RESELLER" | "PARTNERSHIP";
export type PreferredContact = "email" | "phone" | "whatsapp" | "sms";

export interface Lead {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  source: LeadSource;
  source_campaign: string | null;
  source_content: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  first_seen_at: string;
  last_activity_at: string;
  lead_score: number;
  lead_temperature: LeadTemperature;
  status: LeadStatus;
  intent: LeadIntent;
  interests: string[];
  preferred_foods: string[];
  viewed_products: string[];
  viewed_recipes: string[];
  watched_videos: string[];
  cart_value: number;
  total_orders: number;
  total_spent: number;
  catering_guest_count: number | null;
  catering_event_type: string | null;
  catering_event_date: string | null;
  catering_budget: number | null;
  catering_location: string | null;
  notes: string | null;
  assigned_admin: string | null;
  ai_classification: Record<string, unknown>;
  consent_marketing: boolean;
  consent_whatsapp: boolean;
  consent_email: boolean;
  preferred_contact: PreferredContact;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | "PAGE_VIEW" | "PRODUCT_VIEW" | "RECIPE_VIEW" | "VIDEO_VIEW"
  | "SEARCH" | "AI_CHAT" | "AI_RECOMMENDATION" | "RECIPE_DOWNLOAD"
  | "ADD_TO_CART" | "REMOVE_FROM_CART" | "CHECKOUT_STARTED"
  | "CHECKOUT_ABANDONED" | "PURCHASE_COMPLETED" | "WHATSAPP_CLICK"
  | "PHONE_CLICK" | "EMAIL_CLICK" | "CATERING_REQUEST"
  | "NEWSLETTER_SIGNUP" | "LEAD_CAPTURED" | "QR_SCAN"
  | "TV_SESSION" | "TV_CONTENT_VIEW" | "TV_TO_PHONE_CONNECTION"
  | "PRODUCT_VIEW_MULTI" | "REPEATED_VISIT";

export interface LeadEvent {
  id: string;
  lead_id: string;
  event_type: EventType;
  metadata: Record<string, unknown>;
  score_delta: number;
  source: string | null;
  content_id: string | null;
  content_type: string | null;
  created_at: string;
}

export interface LeadScoringRule {
  id: string;
  event_type: string;
  score_value: number;
  description: string | null;
  is_active: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Record<string, unknown>;
  actions: AutomationAction[];
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
}

export interface AutomationAction {
  type: "CREATE_LEAD" | "UPDATE_LEAD" | "NOTIFY_ADMIN" | "SEND_WHATSAPP"
    | "SEND_EMAIL" | "UPDATE_SCORE" | "CREATE_OPPORTUNITY" | "ADD_NOTE";
  params: Record<string, unknown>;
}

export interface AutomationRun {
  id: string;
  rule_id: string;
  lead_id: string | null;
  trigger_event: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
  result: Record<string, unknown>;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Opportunity {
  id: string;
  lead_id: string;
  title: string;
  value: number;
  stage: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCaptureData {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  source?: LeadSource;
  source_campaign?: string;
  consent_marketing?: boolean;
  consent_whatsapp?: boolean;
  consent_email?: boolean;
  preferred_contact?: PreferredContact;
  anonymous_id?: string;
}

export interface LeadTimelineEntry {
  time: string;
  event: string;
  detail: string;
  score_delta: number;
}

export interface LeadDashboardStats {
  total_leads: number;
  new_leads: number;
  hot_leads: number;
  warm_leads: number;
  qualified_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_opportunities: number;
  total_opportunity_value: number;
  source_breakdown: Record<string, number>;
  temperature_breakdown: Record<string, number>;
  recent_events: LeadEvent[];
}

export interface CateringInquiry {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  event_type: string;
  event_date?: string;
  guest_count: number;
  location: string;
  preferred_cuisine?: string;
  estimated_budget?: number;
  additional_requirements?: string;
}
