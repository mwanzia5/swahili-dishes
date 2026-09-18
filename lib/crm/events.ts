import { getAdminClient } from "lib/insforge/admin";
import type { EventType, LeadEvent } from "./types";

export async function trackEvent(params: {
  lead_id: string;
  event_type: EventType;
  metadata?: Record<string, unknown>;
  source?: string;
  content_id?: string;
  content_type?: string;
}): Promise<LeadEvent | null> {
  const admin = getAdminClient();

  const { data, error } = await admin.database
    .from("lead_events")
    .insert({
      lead_id: params.lead_id,
      event_type: params.event_type,
      metadata: params.metadata || {},
      source: params.source || null,
      content_id: params.content_id || null,
      content_type: params.content_type || null,
    })
    .select().single();

  if (error) { console.error("trackEvent error:", error); return null; }
  return data as LeadEvent;
}

export async function getLeadEvents(leadId: string, limit = 50): Promise<LeadEvent[]> {
  const admin = getAdminClient();
  const { data } = await admin.database
    .from("lead_events").select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as LeadEvent[]) || [];
}

export async function getRecentEvents(limit = 100): Promise<LeadEvent[]> {
  const admin = getAdminClient();
  const { data } = await admin.database
    .from("lead_events").select("*, leads(name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as any[]) || [];
}

export async function getEventCountsByType(days = 30): Promise<Record<string, number>> {
  const admin = getAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin.database
    .from("lead_events").select("event_type")
    .gte("created_at", since);

  const counts: Record<string, number> = {};
  (data || []).forEach((r: any) => { counts[r.event_type] = (counts[r.event_type] || 0) + 1; });
  return counts;
}
