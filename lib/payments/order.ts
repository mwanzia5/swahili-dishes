import { getAdminClient } from "lib/insforge/admin";

export type OrderInput = {
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  fulfillment_type: "DELIVERY" | "PICKUP";
  county?: string;
  area?: string;
  estate?: string;
  street?: string;
  instructions?: string;
  items: {
    product_id: string;
    product_name: string;
    unit_price: string;
    quantity: number;
    extras?: unknown;
    notes?: string | null;
  }[];
  subtotal: string;
  delivery_fee: string;
  discount?: string;
  total: string;
  payment_method: "MPESA" | "CARD" | "COD";
};

function generateOrderNumber(): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `SD-${Date.now().toString().slice(-6)}-${rand}`;
}

/**
 * Create an order with its line items and a pending payment row.
 * Returns the created order id.
 */
export async function createOrderWithItems(input: OrderInput): Promise<string> {
  const admin = getAdminClient();
  const orderNumber = generateOrderNumber();

  const { data: order, error } = await admin.database
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: input.user_id,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email,
      status: "PENDING_PAYMENT",
      fulfillment_type: input.fulfillment_type,
      delivery_county: input.county ?? null,
      delivery_area: input.area ?? null,
      delivery_estate: input.estate ?? null,
      delivery_street: input.street ?? null,
      delivery_instructions: input.instructions ?? null,
      subtotal: input.subtotal,
      delivery_fee: input.delivery_fee,
      discount: input.discount ?? "0",
      total: input.total,
      currency: "KES",
      payment_method: input.payment_method,
    })
    .select("id")
    .single();

  if (error || !order) {
    console.error("createOrder error:", error);
    throw new Error("Could not create the order. Please try again.");
  }

  const orderId = order.id;

  const items = input.items.map((item) => ({
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.product_name,
    unit_price: item.unit_price,
    quantity: item.quantity,
    extras: item.extras ?? [],
    notes: item.notes ?? null,
  }));

  const { error: itemsError } = await admin.database
    .from("order_items")
    .insert(items);

  if (itemsError) {
    console.error("createOrder itemsError:", itemsError);
    throw new Error("Could not save order items. Please try again.");
  }

  const { error: paymentError } = await admin.database.from("payments").insert({
    order_id: orderId,
    provider: input.payment_method === "CARD" ? "STRIPE" : input.payment_method === "MPESA" ? "SAFARICOM" : "COD",
    amount: input.total,
    currency: "KES",
    status: "PENDING",
    method: input.payment_method,
    meta: {},
  });

  if (paymentError) {
    console.error("createOrder paymentError:", paymentError);
  }

  return orderId;
}