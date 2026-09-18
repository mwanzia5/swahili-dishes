import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "lib/insforge/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pairing_token } = body;

    if (!pairing_token) {
      return NextResponse.json({ error: "pairing_token required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Find pairing
    const { data: pairing } = await admin.database
      .from("tv_pairings").select("*, tv_sessions(*)")
      .eq("pairing_token", pairing_token)
      .gt("expires_at", new Date().toISOString())
      .is("paired_at", null)
      .single();

    if (!pairing) {
      return NextResponse.json({ error: "Invalid or expired pairing token" }, { status: 404 });
    }

    // Mark as paired
    await admin.database
      .from("tv_pairings")
      .update({ paired_at: new Date().toISOString() })
      .eq("id", pairing.id);

    return NextResponse.json({
      success: true,
      session: pairing.tv_sessions,
    });
  } catch (error: any) {
    console.error("TV pair error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
