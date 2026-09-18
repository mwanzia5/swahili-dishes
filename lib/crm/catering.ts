import { getAdminClient } from "lib/insforge/admin";
import type { CateringInquiry, Lead } from "./types";
import { createLead } from "./leads";
import { trackEvent } from "./events";
import { processEvent } from "./automation";

export async function submitCateringInquiry(inquiry: CateringInquiry): Promise<Lead | null> {
  const lead = await createLead({
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    whatsapp: inquiry.whatsapp || inquiry.phone,
    source: "DIRECT",
    consent_whatsapp: true,
    preferred_contact: "whatsapp",
  });

  if (!lead) return null;

  const admin = getAdminClient();

  // Update lead with catering details
  await admin.database.from("leads").update({
    intent: "CATERING",
    catering_guest_count: inquiry.guest_count,
    catering_event_type: inquiry.event_type,
    catering_event_date: inquiry.event_date || null,
    catering_budget: inquiry.estimated_budget || null,
    catering_location: inquiry.location,
    notes: inquiry.additional_requirements || null,
  }).eq("id", lead.id);

  // Track catering request event
  await trackEvent({
    lead_id: lead.id,
    event_type: "CATERING_REQUEST",
    metadata: {
      event_type: inquiry.event_type,
      guest_count: inquiry.guest_count,
      location: inquiry.location,
      budget: inquiry.estimated_budget,
    },
  });

  // Create opportunity
  await admin.database.from("opportunities").insert({
    lead_id: lead.id,
    title: `Catering: ${inquiry.event_type} (${inquiry.guest_count} guests)`,
    value: inquiry.estimated_budget || inquiry.guest_count * 1500,
    stage: "PROSPECTING",
    probability: 40,
    notes: inquiry.additional_requirements,
  });

  // Process automation
  await processEvent("CATERING_REQUEST", lead.id, {
    event_type: inquiry.event_type,
    guest_count: inquiry.guest_count,
  });

  return lead;
}
