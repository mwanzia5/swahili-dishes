"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { createOrderWithItems } from "lib/payments/order";
import { initiateSTKPush } from "lib/payments/daraja";
import { createCheckoutSession } from "lib/payments/stripe";
import { paymentMethodAvailable } from "lib/payments";
import { getCartFromDB } from "lib/insforge/cart";
import { baseUrl } from "lib/utils";

export type CheckoutResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
  mpesaPrompt?: { amount: string; phone: string };
};

function resolveSession(): Promise<{ userId?: string; sessionToken?: string }> {
  return (async () => {
    const store = await cookies();
    const userId = store.get("swahili_user_id")?.value;
    const sessionToken = store.get("swahili_session")?.value;
    if (userId) return { userId };
    if (sessionToken) return { sessionToken };
    return {};
  })();
}

export async function submitOrder(
  prevState: CheckoutResult | undefined,
  formData: FormData,
): Promise<CheckoutResult> {
  try {
    const session = await resolveSession();
    const cart = await getCartFromDB(session);

    if (!cart || !cart.items || cart.items.length === 0) {
      return { error: "Your cart is empty." };
    }

    const fields = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      phone: String(formData.get("phone") ?? "").trim(),
      fulfillmentType: String(formData.get("fulfillmentType") ?? "DELIVERY"),
      county: String(formData.get("county") ?? "").trim(),
      area: String(formData.get("area") ?? "").trim(),
      estate: String(formData.get("estate") ?? "").trim(),
      street: String(formData.get("street") ?? "").trim(),
      instructions: String(formData.get("instructions") ?? "").trim(),
      paymentMethod: String(formData.get("paymentMethod") ?? "COD"),
    } as {
      name: string;
      email: string;
      phone: string;
      fulfillmentType: string;
      county: string;
      area: string;
      estate: string;
      street: string;
      instructions: string;
      paymentMethod: "MPESA" | "CARD" | "COD";
    };

    const fieldErrors: Record<string, string> = {};
    if (fields.name.length < 2) fieldErrors.name = "Enter your name.";
    if (!/^(\+\d{1,3}[- ]?)?\d{9,12}$/.test(fields.phone)) fieldErrors.phone = "Enter a valid phone number.";
    if (fields.fulfillmentType === "DELIVERY") {
      if (!fields.county) fieldErrors.county = "County is required for delivery.";
      if (!fields.area) fieldErrors.area = "Area is required for delivery.";
    }
    if (!["MPESA", "CARD", "COD"].includes(fields.paymentMethod)) {
      fieldErrors.paymentMethod = "Choose a payment method.";
    }

    if (fields.paymentMethod !== "COD" && !paymentMethodAvailable(fields.paymentMethod)) {
      fieldErrors.paymentMethod =
        fields.paymentMethod === "MPESA"
          ? "M-Pesa payments are not configured yet — please use Cash on Delivery."
          : "Card payments are not configured yet — please use Cash on Delivery.";
    }

    if (Object.keys(fieldErrors).length) return { fieldErrors };

    // Current authenticated user (for linking the order)
    let userId: string | null = null;
    if (session.userId) {
      const client = createServerClient({ cookies: await cookies() });
      const { data } = await client.auth.getCurrentUser();
      userId = data?.user?.id ?? null;
    }

    // Resolve product names for order line items
    const adminMod = await import("lib/insforge/admin");
    const adminClient = adminMod.getAdminClient();
    const productIds = [...new Set(cart.items.map((i: any) => i.product_id))];
    const { data: products } = await adminClient.database
      .from("products")
      .select("id, name")
      .in("id", productIds);
    const nameByProduct = new Map(
      (products ?? []).map((p: any) => [p.id, p.name as string]),
    );

    // Compute totals (align with server-side cart calc)
    const subtotal = cart.items.reduce(
      (sum, i) => sum + parseFloat(i.unit_price ?? "0") * (i.quantity ?? 1),
      0,
    );
    const deliveryFee =
      fields.fulfillmentType === "DELIVERY" ? parseFloat(cart.delivery_fee ?? "0") : 0;
    const discount = parseFloat(cart.discount ?? "0");
    const total = Math.max(0, subtotal + deliveryFee - discount);

    const orderId = await createOrderWithItems({
      user_id: userId,
      customer_name: fields.name,
      customer_phone: fields.phone,
      customer_email: fields.email || null,
      fulfillment_type: fields.fulfillmentType as "DELIVERY" | "PICKUP",
      county: fields.county,
      area: fields.area,
      estate: fields.estate,
      street: fields.street,
      instructions: fields.instructions,
      items: cart.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: nameByProduct.get(item.product_id) ?? "Item",
        unit_price: String(item.unit_price),
        quantity: item.quantity,
        extras: item.extras,
        notes: item.notes,
      })),
      subtotal: subtotal.toFixed(2),
      delivery_fee: deliveryFee.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      payment_method: fields.paymentMethod,
    });

    // Mark the cart as checked out
    await adminClient.database
      .from("carts")
      .update({ status: "CHECKED_OUT" })
      .eq("id", cart.id);

    // Route based on payment method
    if (fields.paymentMethod === "MPESA") {
      await initiateSTKPush({
        orderId,
        amount: total.toFixed(2),
        phone: fields.phone,
        accountRef: `SWH-${orderId.slice(0, 8)}`,
        callbackUrl: `${baseUrl}/api/payments/mpesa/callback`,
      });
      return { redirectTo: `/checkout/success?order=${orderId}` };
    }

    if (fields.paymentMethod === "CARD") {
      const email = fields.email || (userId ? `${userId}@swahilidishes.app` : undefined);
      const url = await createCheckoutSession({
        orderId,
        orderNumber: orderId.slice(0, 8).toUpperCase(),
        amount: total.toFixed(2),
        customerName: fields.name,
        customerEmail: email,
        phone: fields.phone,
        successUrl: `${baseUrl}/checkout/success?order=${orderId}`,
        cancelUrl: `${baseUrl}/checkout?cancelled=1`,
      });
      return { redirectTo: url };
    }

    // COD — order is PENDING_PAYMENT until delivered
    return { redirectTo: `/checkout/success?order=${orderId}` };
  } catch (e) {
    console.error("submitOrder error:", e);
    return { error: e instanceof Error ? e.message : "Checkout failed. Please try again." };
  }
}