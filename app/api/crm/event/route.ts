import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "lib/insforge/admin";
import { trackEvent } from "lib/crm/events";
import { processEvent } from "lib/crm/automation";
import type { EventType } from "lib/crm/types";

const VALID_EVENT_TYPES: EventType[] = [
  "PAGE_VIEW", "PRODUCT_VIEW", "RECIPE_VIEW", "VIDEO_VIEW",
  "SEARCH", "AI_CHAT", "AI_RECOMMENDATION", "RECIPE_DOWNLOAD",
  "ADD_TO_CART", "REMOVE_FROM_CART", "CHECKOUT_STARTED",
  "CHECKOUT_ABANDONED", "PURCHASE_COMPLETED", "WHATSAPP_CLICK",
  "PHONE_CLICK", "EMAIL_CLICK", "CATERING_REQUEST",
  "NEWSLETTER_SIGNUP", "LEAD_CAPTURED", "QR_SCAN",
  "TV_SESSION", "TV_CONTENT_VIEW", "TV_TO_PHONE_CONNECTION",
  "PRODUCT_VIEW_MULTI", "REPEATED_VISIT",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, anonymous_id, metadata, content_id, content_type, user_id } = body;

    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Find or create lead
    let leadId: string | null = null;

    if (user_id) {
      const { data: existing } = await admin.database
        .from("leads").select("id").eq("user_id", user_id).maybeSingle();
      if (existing) leadId = existing.id;
    }

    if (!leadId && anonymous_id) {
      const { data: existing } = await admin.database
        .from("leads").select("id").eq("anonymous_id", anonymous_id).maybeSingle();
      if (existing) leadId = existing.id;
    }

    // Create lead if not found
    if (!leadId) {
      const { data: newLead, error } = await admin.database
        .from("leads")
        .insert({
          anonymous_id: anonymous_id || null,
          user_id: user_id || null,
          source: metadata?.source || "DIRECT",
          lead_score: 0,
          lead_temperature: "COLD",
          status: "NEW",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Failed to create lead:", error);
        return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
      }
      leadId = newLead.id;
    }

    // Track event
    const event = await trackEvent({
      lead_id: leadId!,
      event_type: event_type as EventType,
      metadata: metadata || {},
      source: metadata?.source,
      content_id,
      content_type,
    });

    // Process automation
    await processEvent(event_type, leadId!, metadata || {});

    return NextResponse.json({ success: true, lead_id: leadId, event_id: event?.id });
  } catch (error: any) {
    console.error("CRM event error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
