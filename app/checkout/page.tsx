import { redirect } from "next/navigation";
import Link from "next/link";
import { readCart } from "components/cart/actions";
import { getSessionUser } from "app/auth/actions";
import { getAdminClient } from "lib/insforge/admin";
import CheckoutForm from "components/checkout/checkout-form";
import { CheckoutTracker } from "components/crm/checkout-tracker";
import { formatPrice } from "lib/utils";
import { PAYMENT_METHODS, availablePaymentMethods } from "lib/payments";

export const metadata = {
  title: "Checkout",
  description: "Complete your order at Swahili Dishes.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cancelled = Boolean(params?.cancelled);

  const [cart, user] = await Promise.all([readCart(), getSessionUser()]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-8 py-24 text-center">
        <h1 className="text-2xl font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>Your cart is empty</h1>
        <p className="mt-2 text-cream-300">Add some dishes before checking out.</p>
        <Link
          href="/menu"
          className="btn btn-primary mt-6"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  // Resolve product names for the summary
  const productIds = [...new Set(cart.items.map((i: any) => i.product_id))];
  const { data: products } = await getAdminClient().database
    .from("products")
    .select("id, slug, name, image_url")
    .in("id", productIds);
  const byId = new Map((products ?? []).map((p: any) => [p.id, p]));

  const methods = availablePaymentMethods();
  const methodMeta = PAYMENT_METHODS.find((m) => m.value === methods[0]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-12">
      <CheckoutTracker />
      <h1 className="mb-8 text-2xl font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>Checkout</h1>

      {cancelled && (
        <div className="mb-6 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
          Payment was cancelled. Your order was not placed — no charges were made.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <CheckoutForm hasAccount={Boolean(user)} />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-indigo-line bg-indigo-800 p-6">
            <h2 className="mb-4 text-lg font-medium text-cream-050">Order summary</h2>
            <ul className="space-y-3">
              {cart.items.map((item: any) => {
                const extraTotal = (item.extras ?? []).reduce(
                  (sum: number, e: any) => sum + parseFloat(e.price ?? "0"),
                  0,
                );
                const lineTotal =
                  (parseFloat(item.unit_price ?? "0") + extraTotal) * (item.quantity ?? 1);
                return (
                  <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-cream-300">
                      {item.quantity} × {byId.get(item.product_id)?.name ?? "Item"}
                    </span>
                    <span className="shrink-0 text-cream-050">
                      {formatPrice(lineTotal)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-6 space-y-2 border-t border-indigo-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-cream-300">Subtotal</dt>
                <dd className="text-cream-050">{formatPrice(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-300">Delivery</dt>
                <dd className="text-cream-050">{formatPrice(cart.delivery_fee ?? 0)}</dd>
              </div>
              {cart.discount ? (
                <div className="flex justify-between">
                  <dt className="text-cream-300">Discount</dt>
                  <dd className="text-gold-400">−{formatPrice(cart.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-indigo-line pt-3 text-base font-medium">
                <dt className="text-cream-050">Total</dt>
                <dd className="text-cream-050">{formatPrice(cart.total)}</dd>
              </div>
            </dl>
          </div>

          {!methodMeta ? null : (
            <p className="px-2 text-xs text-cream-300">
              Pay safely with {methods.map((m) => PAYMENT_METHODS.find((x) => x.value === m)?.label).join(" or ")}.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}