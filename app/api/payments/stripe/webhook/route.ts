import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "lib/insforge/admin";

export async function POST(request: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(key);
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = getAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) break;

      await admin.database.from("payments").update({
        status: "COMPLETED",
        paid_at: new Date().toISOString(),
        provider_reference: session.id,
        meta: {
          payment_intent: session.payment_intent,
          currency: session.currency,
        },
      }).eq("provider_reference", session.id);

      await admin.database.from("orders").update({
        status: "PAID",
        paid_at: new Date().toISOString(),
      }).eq("id", orderId);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) break;
      await admin.database.from("payments").update({ status: "FAILED" })
        .eq("provider_reference", session.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}