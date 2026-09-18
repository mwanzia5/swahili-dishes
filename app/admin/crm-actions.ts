"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { getAdminClient } from "lib/insforge/admin";
import { getCRMStats, getLeads, getLeadById, getLeadTimeline, updateLeadStatus, updateLeadNotes, assignLead } from "lib/crm/leads";
import { getEventCountsByType, getRecentEvents } from "lib/crm/events";
import { submitCateringInquiry } from "lib/crm/catering";
import { processEvent } from "lib/crm/automation";
import type { LeadStatus, CateringInquiry, EventType } from "lib/crm/types";

async function requireAdmin() {
  const store = await cookies();
  const userId = store.get("swahili_user_id")?.value;
  if (!userId) return null;

  const admin = getAdminClient();
  const { data } = await admin.database
    .from("profiles").select("role").eq("id", userId).single();

  if (!data || !["ADMIN", "STAFF"].includes(data.role)) return null;
  return userId;
}

export async function getCrmDashboardStats() {
  const adminId = await requireAdmin();
  if (!adminId) return null;
  return getCRMStats();
}

export async function getCrmLeads(params: {
  status?: LeadStatus; temperature?: string; source?: string;
  search?: string; limit?: number; offset?: number;
}) {
  const adminId = await requireAdmin();
  if (!adminId) return { leads: [], total: 0 };
  return getLeads(params);
}

export async function getCrmLeadDetail(leadId: string) {
  const adminId = await requireAdmin();
  if (!adminId) return null;
  const lead = await getLeadById(leadId);
  if (!lead) return null;
  const timeline = await getLeadTimeline(leadId);
  return { lead, timeline };
}

export async function updateCrmLeadStatus(leadId: string, status: LeadStatus) {
  const adminId = await requireAdmin();
  if (!adminId) return false;
  return updateLeadStatus(leadId, status);
}

export async function updateCrmLeadNotes(leadId: string, notes: string) {
  const adminId = await requireAdmin();
  if (!adminId) return false;
  return updateLeadNotes(leadId, notes);
}

export async function assignCrmLead(leadId: string) {
  const adminId = await requireAdmin();
  if (!adminId) return false;
  return assignLead(leadId, adminId);
}

export async function getCrmEventStats() {
  const adminId = await requireAdmin();
  if (!adminId) return {};
  return getEventCountsByType(30);
}

export async function getCrmRecentEvents() {
  const adminId = await requireAdmin();
  if (!adminId) return [];
  return getRecentEvents(50);
}

export async function submitCateringLead(inquiry: CateringInquiry) {
  return submitCateringInquiry(inquiry);
}

export async function trackCrmEvent(params: {
  lead_id: string;
  event_type: EventType;
  metadata?: Record<string, unknown>;
  source?: string;
  content_id?: string;
  content_type?: string;
}) {
  const { trackEvent } = await import("lib/crm/events");
  const event = await trackEvent(params);
  if (event) {
    await processEvent(params.event_type, params.lead_id, params.metadata);
  }
  return event;
}
