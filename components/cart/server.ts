import { cookies } from "next/headers";
import { getCartFromDB } from "lib/insforge/cart";

type CartState = {
  id: string;
  items: any[];
  total_quantity: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
};

const empty: CartState = {
  id: "",
  items: [],
  total_quantity: 0,
  subtotal: 0,
  delivery_fee: 0,
  discount: 0,
  total: 0,
};

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
 * Read-only cart loader — safe during RSC renders. Never sets cookies and
 * never creates a DB cart for a request that has no session yet (so static
 * prerendering isn't broken by cookie writes). The guest cookie + cart row
 * are created lazily by the first cart mutation.
 */
export async function readCartServer(): Promise<CartState> {
  const session = await readSession();
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