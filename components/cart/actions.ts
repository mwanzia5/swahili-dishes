"use server";

import { cookies } from "next/headers";
import {
  addItemToCart,
  updateCartItemQuantity as updateQty,
  removeCartItem as removeLine,
  clearCart,
  getCartFromDB,
} from "lib/insforge/cart";

type CartMutationResult = {
  items: Awaited<ReturnType<typeof getCartFromDB>> extends null
    ? Awaited<ReturnType<typeof getCartFromDB>>
    : NonNullable<Awaited<ReturnType<typeof getCartFromDB>>>;
} | { error: string };

/**
 * Read-only session lookup — NEVER sets cookies (safe during RSC renders).
 */
async function readSession(): Promise<{ userId?: string; sessionToken?: string }> {
  const store = await cookies();
  const userId = store.get("swahili_user_id")?.value;
  const sessionToken = store.get("swahili_session")?.value;
  if (userId) return { userId };
  if (sessionToken) return { sessionToken };
  return {};
}

/**
 * Session resolver for Server Actions / Route Handlers. May set the guest
 * cookie when a new session is created (allowed there, not during RSC).
 */
async function resolveSession(): Promise<{ userId?: string; sessionToken?: string }> {
  const store = await cookies();
  const userId = store.get("swahili_user_id")?.value;
  const sessionToken = store.get("swahili_session")?.value;

  if (userId) return { userId };

  if (sessionToken) return { sessionToken };

  // Generate anonymous session token
  const newToken = crypto.randomUUID();
  store.set("swahili_session", newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { sessionToken: newToken };
}

export async function addItem(
  _prevState: unknown,
  payload: {
    productId: string;
    variantId?: string;
    quantity?: number;
    unitPrice: string;
    extras?: { id: string; title: string; price: string }[];
    notes?: string;
  },
): Promise<CartMutationResult> {
  try {
    const session = await resolveSession();
    const items = await addItemToCart({
      ...session,
      productId: payload.productId,
      variantId: payload.variantId,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      extras: payload.extras,
      notes: payload.notes,
    });
    const cart = await getCartFromDB(session);
    return { items: cart! };
  } catch (e) {
    console.error("addItem error:", e);
    return { error: "Failed to add item to cart" };
  }
}

export async function updateItemQuantity(
  _prevState: unknown,
  payload: { cartId: string; itemId: string; quantity: number },
): Promise<CartMutationResult> {
  try {
    const session = await resolveSession();
    await updateQty(payload.cartId, payload.itemId, payload.quantity);
    const cart = await getCartFromDB(session);
    return { items: cart! };
  } catch (e) {
    console.error("updateItemQuantity error:", e);
    return { error: "Failed to update item quantity" };
  }
}

export async function removeItem(
  _prevState: unknown,
  payload: { cartId: string; itemId: string },
): Promise<CartMutationResult> {
  try {
    const session = await resolveSession();
    await removeLine(payload.cartId, payload.itemId);
    const cart = await getCartFromDB(session);
    return { items: cart! };
  } catch (e) {
    console.error("removeItem error:", e);
    return { error: "Failed to remove item" };
  }
}

export async function clearCartAction(
  _prevState: unknown,
  cartId: string,
): Promise<CartMutationResult> {
  try {
    const session = await resolveSession();
    await clearCart(cartId);
    const cart = await getCartFromDB(session);
    return { items: cart! };
  } catch (e) {
    console.error("clearCart error:", e);
    return { error: "Failed to clear cart" };
  }
}

/**
 * Read-only cart loader — safe during RSC renders. Never sets cookies and
 * never creates a DB cart for a request that has no session yet (so static
 * prerendering isn't broken by cookie writes). The guest cookie + cart row
 * are created lazily by the first cart mutation.
 */
export async function readCart() {
  const session = await readSession();
  const empty = {
    id: "",
    items: [] as never[],
    total_quantity: 0,
    subtotal: 0,
    delivery_fee: 0,
    discount: 0,
    total: 0,
  };
  if (!session.userId && !session.sessionToken) return empty;

  const cart = await getCartFromDB(session);
  if (!cart) return empty;

  const items = cart.items ?? [];
  const subtotal = items.reduce(
    (sum: number, i: any) => sum + parseFloat(i.unit_price ?? "0") * (i.quantity ?? 1),
    0,
  );
  const totalQuantity = items.reduce((sum: number, i: any) => sum + (i.quantity ?? 0), 0);

  return {
    id: cart.id,
    items,
    total_quantity: totalQuantity,
    subtotal,
    delivery_fee: parseFloat(cart.delivery_fee ?? "0"),
    discount: parseFloat(cart.discount ?? "0"),
    total: subtotal + parseFloat(cart.delivery_fee ?? "0") - parseFloat(cart.discount ?? "0"),
  };
}
