import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "app/auth/actions";
import { getAdminClient } from "lib/insforge/admin";
import { formatPrice, formatDate } from "lib/utils";
import { ORDER_STATUSES } from "lib/constants";
import Link from "next/link";

export const metadata = {
  title: "Order Details",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const admin = getAdminClient();

  const { data: order } = await admin.database
    .from("orders")
    .select(
      `id, order_number, status, subtotal, delivery_fee, discount, total, currency,
       payment_method, paid_at, created_at, notes,
       customer_name, customer_phone, delivery_county, delivery_area,
       delivery_estate, delivery_street, delivery_instructions,
       order_items(id, product_id, product_name, quantity, unit_price, notes),
       order_status_history(id, from_status, to_status, note, created_at)`,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const status = ORDER_STATUSES.find((s) => s.value === order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/account"
        className="mb-6 inline-block text-sm text-cream-300 hover:text-white"
      >
        ← Back to account
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Order #{order.order_number}
          </h1>
          <p className="mt-1 text-sm text-cream-300">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border border-current px-3 py-1 text-sm ${
            status?.color ?? "text-cream-300"
          }`}
        >
          {status?.label ?? order.status}
        </span>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-indigo-line p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-cream-300">
            Items
          </h2>
          <ul className="divide-y divide-neutral-800">
            {(order.order_items ?? []).map((item: any) => (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white">{item.product_name}</p>
                  {item.notes ? (
                    <p className="mt-0.5 text-xs text-cream-300">{item.notes}</p>
                  ) : null}
                </div>
                <p className="text-sm text-cream-300">
                  {item.quantity} × {formatPrice(Number(item.unit_price))}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {order.delivery_county && (
          <section className="rounded-xl border border-indigo-line p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-cream-300">
              Delivery details
            </h2>
            <p className="text-white">
              {order.delivery_county}
              {order.delivery_area ? `, ${order.delivery_area}` : ""}
              {order.delivery_estate ? `, ${order.delivery_estate}` : ""}
              {order.delivery_street ? ` · ${order.delivery_street}` : ""}
            </p>
            {order.delivery_instructions ? (
              <p className="mt-2 text-sm text-cream-300">
                {order.delivery_instructions}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-cream-300">{order.customer_phone}</p>
          </section>
        )}

        <section className="rounded-xl border border-indigo-line p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-cream-300">
            Summary
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-cream-300">Subtotal</dt>
              <dd className="text-white">
                {formatPrice(Number(order.subtotal), order.currency ?? "KES")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream-300">Delivery</dt>
              <dd className="text-white">
                {formatPrice(Number(order.delivery_fee ?? 0), order.currency ?? "KES")}
              </dd>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-cream-300">Discount</dt>
                <dd className="text-green-400">
                  −{formatPrice(Number(order.discount), order.currency ?? "KES")}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-indigo-line pt-3 text-base font-medium">
              <dt className="text-white">Total</dt>
              <dd className="text-white">
                {formatPrice(Number(order.total), order.currency ?? "KES")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream-300">Payment</dt>
              <dd className="text-white">{order.payment_method ?? "—"}</dd>
            </div>
            {order.paid_at && (
              <div className="flex justify-between">
                <dt className="text-cream-300">Paid</dt>
                <dd className="text-white">{formatDate(order.paid_at)}</dd>
              </div>
            )}
          </dl>
        </section>

        {(order.order_status_history ?? []).length > 0 && (
          <section className="rounded-xl border border-indigo-line p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-cream-300">
              History
            </h2>
            <ol className="space-y-2 text-sm">
              {(order.order_status_history ?? []).map((h: any) => {
                const from = ORDER_STATUSES.find((s) => s.value === h.from_status)?.label ?? h.from_status;
                const to = ORDER_STATUSES.find((s) => s.value === h.to_status)?.label ?? h.to_status;
                return (
                  <li key={h.id} className="text-cream-300">
                    <span className="text-white">{from}</span> →{" "}
                    <span className="text-white">{to}</span> ·{" "}
                    {formatDate(h.created_at)}
                    {h.note ? <span className="text-cream-300"> — {h.note}</span> : null}
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}