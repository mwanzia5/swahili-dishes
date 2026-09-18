import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "lib/insforge/admin";
import { trackEvent } from "lib/crm/events";
import { processEvent } from "lib/crm/automation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, whatsapp, source, consent_marketing, consent_whatsapp, preferred_contact } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Check for existing lead by email
    const { data: existing } = await admin.database
      .from("leads").select("id").eq("email", email.toLowerCase().trim()).maybeSingle();

    let leadId: string;

    if (existing) {
      // Update existing lead
      leadId = existing.id;
      await admin.database.from("leads").update({
        name: name || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        consent_marketing: consent_marketing ?? false,
        consent_whatsapp: consent_whatsapp ?? false,
        preferred_contact: preferred_contact || "email",
        last_activity_at: new Date().toISOString(),
      }).eq("id", leadId);
    } else {
      // Create new lead
      const { data: newLead, error } = await admin.database
        .from("leads")
        .insert({
          name: name || null,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          whatsapp: whatsapp || null,
          source: source || "DIRECT",
          consent_marketing: consent_marketing ?? false,
          consent_whatsapp: consent_whatsapp ?? false,
          preferred_contact: preferred_contact || "email",
          lead_score: 3,
          lead_temperature: "COLD",
          status: "NEW",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Lead capture error:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
      }
      leadId = newLead.id;
    }

    // Track the capture event
    await trackEvent({
      lead_id: leadId,
      event_type: "LEAD_CAPTURED",
      metadata: { source, method: preferred_contact },
    });

    await processEvent("LEAD_CAPTURED", leadId, { source });

    return NextResponse.json({ success: true, lead_id: leadId });
  } catch (error: any) {
    console.error("Lead capture error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
