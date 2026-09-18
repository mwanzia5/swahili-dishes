import { getAdminClient } from "lib/insforge/admin";
import type { Lead, LeadCaptureData, LeadSource, LeadStatus } from "./types";

export async function createLead(data: LeadCaptureData): Promise<Lead | null> {
  const admin = getAdminClient();

  if (data.email) {
    const { data: existing } = await admin.database
      .from("leads").select("*")
      .eq("email", data.email.toLowerCase().trim()).maybeSingle();
    if (existing) return updateLead(existing.id, data);
  }

  if (data.phone) {
    const { data: existing } = await admin.database
      .from("leads").select("*")
      .eq("phone", data.phone.trim()).maybeSingle();
    if (existing) return updateLead(existing.id, data);
  }

  const { data: lead, error } = await admin.database
    .from("leads")
    .insert({
      name: data.name?.trim() || null,
      email: data.email?.toLowerCase().trim() || null,
      phone: data.phone?.trim() || null,
      whatsapp: data.whatsapp?.trim() || null,
      source: data.source || "DIRECT",
      source_campaign: data.source_campaign || null,
      anonymous_id: data.anonymous_id || null,
      consent_marketing: data.consent_marketing ?? false,
      consent_whatsapp: data.consent_whatsapp ?? false,
      consent_email: data.consent_email ?? false,
      preferred_contact: data.preferred_contact || "email",
      lead_score: 3,
      lead_temperature: "COLD",
      status: "NEW",
    })
    .select().single();

  if (error) { console.error("createLead error:", error); return null; }
  return lead as Lead;
}

export async function updateLead(leadId: string, data: Partial<LeadCaptureData>): Promise<Lead | null> {
  const admin = getAdminClient();
  const updates: Record<string, unknown> = { last_activity_at: new Date().toISOString() };

  if (data.name) updates.name = data.name.trim();
  if (data.email) updates.email = data.email.toLowerCase().trim();
  if (data.phone) updates.phone = data.phone.trim();
  if (data.whatsapp) updates.whatsapp = data.whatsapp.trim();
  if (data.source) updates.source = data.source;
  if (data.consent_marketing !== undefined) updates.consent_marketing = data.consent_marketing;
  if (data.consent_whatsapp !== undefined) updates.consent_whatsapp = data.consent_whatsapp;
  if (data.consent_email !== undefined) updates.consent_email = data.consent_email;
  if (data.preferred_contact) updates.preferred_contact = data.preferred_contact;

  const { data: lead, error } = await admin.database
    .from("leads").update(updates).eq("id", leadId).select().single();

  if (error) { console.error("updateLead error:", error); return null; }
  return lead as Lead;
}

export async function findOrCreateLeadByAnonymous(anonymousId: string, source?: LeadSource): Promise<Lead | null> {
  const admin = getAdminClient();
  const { data: existing } = await admin.database
    .from("leads").select("*").eq("anonymous_id", anonymousId).maybeSingle();
  if (existing) return existing as Lead;
  return createLead({ anonymous_id: anonymousId, source: source || "DIRECT" });
}

export async function findLeadByUserId(userId: string): Promise<Lead | null> {
  const admin = getAdminClient();
  const { data } = await admin.database.from("leads").select("*").eq("user_id", userId).maybeSingle();
  return (data as Lead) || null;
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const admin = getAdminClient();
  const { data } = await admin.database.from("leads").select("*").eq("id", leadId).maybeSingle();
  return (data as Lead) || null;
}

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<boolean> {
  const admin = getAdminClient();
  const { error } = await admin.database
    .from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", leadId);
  return !error;
}

export async function updateLeadNotes(leadId: string, notes: string): Promise<boolean> {
  const admin = getAdminClient();
  const { error } = await admin.database
    .from("leads").update({ notes, updated_at: new Date().toISOString() }).eq("id", leadId);
  return !error;
}

export async function assignLead(leadId: string, adminUserId: string): Promise<boolean> {
  const admin = getAdminClient();
  const { error } = await admin.database
    .from("leads").update({ assigned_admin: adminUserId, status: "CONTACTED", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  return !error;
}

export async function getLeads(params: {
  status?: LeadStatus; temperature?: string; source?: string;
  search?: string; limit?: number; offset?: number;
}): Promise<{ leads: Lead[]; total: number }> {
  const admin = getAdminClient();
  const { status, temperature, source, search, limit = 50, offset = 0 } = params;

  let query = admin.database.from("leads").select("*", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (temperature) query = query.eq("lead_temperature", temperature);
  if (source) query = query.eq("source", source);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

  const { data, count, error } = await query
    .order("lead_score", { ascending: false }).range(offset, offset + limit - 1);

  if (error) { console.error("getLeads error:", error); return { leads: [], total: 0 }; }
  return { leads: (data as Lead[]) || [], total: count || 0 };
}

export async function getLeadTimeline(leadId: string): Promise<Array<{
  time: string; event: string; detail: string; score_delta: number;
}>> {
  const admin = getAdminClient();
  const { data } = await admin.database
    .from("lead_events").select("*")
    .eq("lead_id", leadId).order("created_at", { ascending: false }).limit(50);

  if (!data) return [];
  return data.map((e: any) => ({
    time: e.created_at,
    event: e.event_type,
    detail: JSON.stringify(e.metadata),
    score_delta: e.score_delta,
  }));
}

export async function getCRMStats(): Promise<{
  total_leads: number; new_leads: number; hot_leads: number;
  warm_leads: number; qualified_leads: number; converted_leads: number;
  conversion_rate: number; source_breakdown: Record<string, number>;
  temperature_breakdown: Record<string, number>;
}> {
  const admin = getAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { count: total } = await admin.database.from("leads").select("*", { count: "exact", head: true });
  const { count: newLeads } = await admin.database.from("leads").select("*", { count: "exact", head: true }).eq("status", "NEW");
  const { count: hot } = await admin.database.from("leads").select("*", { count: "exact", head: true }).eq("lead_temperature", "HOT");
  const { count: warm } = await admin.database.from("leads").select("*", { count: "exact", head: true }).eq("lead_temperature", "WARM");
  const { count: qualified } = await admin.database.from("leads").select("*", { count: "exact", head: true }).eq("status", "QUALIFIED");
  const { count: converted } = await admin.database.from("leads").select("*", { count: "exact", head: true }).eq("status", "CONVERTED");

  const { data: sourceData } = await admin.database.from("leads").select("source");
  const sourceBreakdown: Record<string, number> = {};
  (sourceData || []).forEach((r: any) => { sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1; });

  const { data: tempData } = await admin.database.from("leads").select("lead_temperature");
  const tempBreakdown: Record<string, number> = {};
  (tempData || []).forEach((r: any) => { tempBreakdown[r.lead_temperature] = (tempBreakdown[r.lead_temperature] || 0) + 1; });

  return {
    total_leads: total || 0, new_leads: newLeads || 0,
    hot_leads: hot || 0, warm_leads: warm || 0,
    qualified_leads: qualified || 0, converted_leads: converted || 0,
    conversion_rate: total ? ((converted || 0) / total) * 100 : 0,
    source_breakdown: sourceBreakdown, temperature_breakdown: tempBreakdown,
  };
}
