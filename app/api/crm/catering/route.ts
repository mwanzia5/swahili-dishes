import { NextRequest, NextResponse } from "next/server";
import { submitCateringInquiry } from "lib/crm/catering";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, whatsapp, email, event_type, event_date, guest_count, location, preferred_cuisine, estimated_budget, additional_requirements } = body;

    if (!name || !phone || !guest_count || !location) {
      return NextResponse.json({ error: "Name, phone, guest count, and location are required" }, { status: 400 });
    }

    const lead = await submitCateringInquiry({
      name, phone, whatsapp, email, event_type,
      event_date, guest_count: parseInt(guest_count), location,
      preferred_cuisine, estimated_budget: estimated_budget ? parseFloat(estimated_budget) : undefined,
      additional_requirements,
    });

    if (!lead) {
      return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead_id: lead.id });
  } catch (error: any) {
    console.error("Catering inquiry error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
