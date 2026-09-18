import { getAdminClient } from "./admin";
import type { Cart, CartItem } from "./types";

/**
 * Read a cart by session token or user_id. Guest carts use session_token;
 * authenticated carts use user_id.
 *
 * Returns the cart with items joined (lightweight columns).
 */
export async function getCartFromDB(opts: {
  userId?: string;
  sessionToken?: string;
}): Promise<Cart | null> {
  const admin = getAdminClient();
  const { userId, sessionToken } = opts;

  if (!userId && !sessionToken) return null;

  let q = admin.database
    .from("carts")
    .select("*, items:cart_items(id, cart_id, product_id, variant_id, quantity, unit_price, extras, notes, created_at)")
    .eq("status", "ACTIVE")
    .order("created_at", { referencedTable: "cart_items" })
    .limit(200, { referencedTable: "cart_items" });

  if (userId) {
    q = q.eq("user_id", userId);
  } else if (sessionToken) {
    q = q.eq("session_token", sessionToken);
  }

  const { data, error } = await q.maybeSingle();
  if (error) {
    // Gracefully handle missing tables, RLS denials, etc.
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      // Table doesn't exist yet — not an error for new setups
      return null;
    }
    return null;
  }
  return data as Cart | null;
}

/**
 * Ensure an ACTIVE cart exists for this user/session, return its ID.
 */
export async function ensureCart(opts: {
  userId?: string;
  sessionToken?: string;
}): Promise<string> {
  const admin = getAdminClient();
  const existing = await getCartFromDB(opts);
  if (existing) return existing.id;

  const { data, error } = await admin.database
    .from("carts")
    .insert([{
      user_id: opts.userId ?? null,
      session_token: opts.sessionToken ?? null,
      status: "ACTIVE",
    }])
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create cart");
  return data.id as string;
}

/**
 * Add an item to a cart.  If the same product+variant already exists,
 * increment quantity instead of inserting a duplicate.
 */
export async function addItemToCart(opts: {
  userId?: string;
  sessionToken?: string;
  productId: string;
  variantId?: string;
  quantity?: number;
  unitPrice: string;
  extras?: { id: string; title: string; price: string }[];
  notes?: string;
}): Promise<CartItem[]> {
  const admin = getAdminClient();
  const cartId = await ensureCart({ userId: opts.userId, sessionToken: opts.sessionToken });

  // Check for existing line
  let existingQ = admin.database
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", opts.productId);

  if (opts.variantId) {
    existingQ = existingQ.eq("variant_id", opts.variantId);
  } else {
    existingQ = existingQ.is("variant_id", null);
  }

  const { data: existing } = await existingQ.maybeSingle();

  const quantity = opts.quantity ?? 1;

  if (existing) {
    const newQty = existing.quantity + quantity;
    await admin.database
      .from("cart_items")
      .update({ quantity: newQty, notes: opts.notes ?? undefined })
      .eq("id", existing.id);
  } else {
    await admin.database.from("cart_items").insert([{
      cart_id: cartId,
      product_id: opts.productId,
      variant_id: opts.variantId ?? null,
      quantity,
      unit_price: opts.unitPrice,
      extras: opts.extras ?? [],
      notes: opts.notes ?? null,
    }]);
  }

  // Return updated cart items
  const { data: items } = await admin.database
    .from("cart_items")
    .select("id, cart_id, product_id, variant_id, quantity, unit_price, extras, notes, created_at")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  return (items as CartItem[]) ?? [];
}

/**
 * Update an item's quantity (set 0 to remove).
 */
export async function updateCartItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number,
): Promise<CartItem[]> {
  const admin = getAdminClient();

  if (quantity <= 0) {
    await admin.database.from("cart_items").delete().eq("id", itemId);
  } else {
    await admin.database.from("cart_items").update({ quantity }).eq("id", itemId);
  }

  const { data: items } = await admin.database
    .from("cart_items")
    .select("id, cart_id, product_id, variant_id, quantity, unit_price, extras, notes, created_at")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  return (items as CartItem[]) ?? [];
}

/**
 * Remove an item from a cart.
 */
export async function removeCartItem(cartId: string, itemId: string): Promise<CartItem[]> {
  const admin = getAdminClient();
  await admin.database.from("cart_items").delete().eq("id", itemId);

  const { data: items } = await admin.database
    .from("cart_items")
    .select("id, cart_id, product_id, variant_id, quantity, unit_price, extras, notes, created_at")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  return (items as CartItem[]) ?? [];
}

/**
 * Clear all items from a cart.
 */
export async function clearCart(cartId: string): Promise<void> {
  const admin = getAdminClient();
  await admin.database.from("cart_items").delete().eq("cart_id", cartId);
}

/**
 * Set cart status (e.g. CHECKED_OUT).
 */
export async function setCartStatus(cartId: string, status: "ACTIVE" | "CHECKED_OUT" | "ABANDONED"): Promise<void> {
  const admin = getAdminClient();
  await admin.database.from("carts").update({ status }).eq("id", cartId);
}