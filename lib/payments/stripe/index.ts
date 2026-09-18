import Stripe from "stripe";
import { getAdminClient } from "lib/insforge/admin";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Card payments are not configured on this store yet.");
  return new Stripe(key);
}

/**
 * Create a Stripe Checkout Session for an order and persist the session id.
 * Redirect the customer to `session.url` to pay.
 */
export async function createCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  amount: string; // KES (whole units)
  customerName: string;
  customerEmail: string | null | undefined;
  phone: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.customerEmail ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "kes",
          unit_amount: Math.round(parseFloat(params.amount) * 100),
          product_data: {
            name: `Order ${params.orderNumber}`,
            description: "Swahili Dishes order",
          },
        },
      },
    ],
    metadata: {
      order_id: params.orderId,
      order_number: params.orderNumber,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  const admin = getAdminClient();
  const { data: payment } = await admin.database
    .from("payments")
    .select("id")
    .eq("order_id", params.orderId)
    .eq("provider", "STRIPE")
    .maybeSingle();

  if (payment) {
    await admin.database
      .from("payments")
      .update({ provider_reference: session.id, meta: { mode: "checkout_session" } })
      .eq("id", payment.id);
  }

  if (!session.url) throw new Error("Could not create the payment link.");
  return session.url;
}

/**
 * Confirm a Stripe payment succeeded (called from the webhook handler).
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const admin = getAdminClient();

  await admin.database.from("payments").update({
    status: "COMPLETED",
    paid_at: new Date().toISOString(),
    provider_reference: session.id,
  }).eq("provider_reference", session.id);

  await admin.database.from("orders").update({
    status: "PAID",
    paid_at: new Date().toISOString(),
  }).eq("id", orderId);
}