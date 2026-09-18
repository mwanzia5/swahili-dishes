import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "lib/insforge/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { device_id, content } = body;

    if (!device_id) {
      return NextResponse.json({ error: "device_id required" }, { status: 400 });
    }

    const admin = getAdminClient();
    const sessionToken = crypto.randomUUID();

    const { data: session, error } = await admin.database
      .from("tv_sessions")
      .insert({
        device_id,
        session_token: sessionToken,
        content_viewed: content ? [content] : [],
      })
      .select()
      .single();

    if (error) {
      console.error("TV session error:", error);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Create a short-lived pairing token
    const pairingToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    await admin.database.from("tv_pairings").insert({
      tv_session_id: session.id,
      pairing_token: pairingToken,
      expires_at: expiresAt,
    });

    return NextResponse.json({
      session_id: session.id,
      session_token: sessionToken,
      pairing_token: pairingToken,
      qr_data: `${process.env.NEXT_PUBLIC_APP_URL}/tv/connect/${pairingToken}`,
    });
  } catch (error: any) {
    console.error("TV session error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_token, content } = body;

    if (!session_token) {
      return NextResponse.json({ error: "session_token required" }, { status: 400 });
    }

    const admin = getAdminClient();

    const { data: session } = await admin.database
      .from("tv_sessions").select("content_viewed")
      .eq("session_token", session_token).single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updatedContent = [...(session.content_viewed as any[] || []), content].slice(-50);

    await admin.database
      .from("tv_sessions")
      .update({ content_viewed: updatedContent, last_activity_at: new Date().toISOString() })
      .eq("session_token", session_token);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("TV update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
