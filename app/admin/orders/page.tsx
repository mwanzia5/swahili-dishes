import Link from "next/link";
import { getAdminClient } from "lib/insforge/admin";
import { formatPrice, formatDate } from "lib/utils";
import { ORDER_STATUSES } from "lib/constants";
import { OrderStatusControls } from "components/admin/order-status-controls";

export const metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const statusFilter = typeof params?.status === "string" ? params.status : "";

  const admin = getAdminClient();

  let query = admin.database
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, status, total, currency, fulfillment_type, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: orders } = await query;

  const list = (orders ?? []) as {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    total: string;
    currency: string;
    fulfillment_type: string;
    created_at: string;
  }[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-white">Orders</h2>
        <nav className="flex flex-wrap gap-2" aria-label="Filter orders">
          <Link
            href="/admin/orders"
            className={
              !statusFilter
                ? "rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-400)]/10 px-3 py-1 text-xs text-white"
                : "rounded-full border border-indigo-line px-3 py-1 text-xs text-cream-300 hover:text-white"
            }
          >
            All
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s.value}
              href={`/admin/orders?status=${s.value}`}
              className={
                statusFilter === s.value
                  ? "rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-400)]/10 px-3 py-1 text-xs text-white"
                  : "rounded-full border border-indigo-line px-3 py-1 text-xs text-cream-300 hover:text-white"
              }
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-indigo-line p-10 text-center text-neutral-600">
          <p>No orders{statusFilter ? ` with status "${statusFilter}"` : ""}.</p>
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-indigo-line text-xs uppercase tracking-wide text-neutral-600">
              <th className="pb-3 pr-4">Order</th>
              <th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Total</th>
              <th className="pb-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {list.map((order) => {
              const status = ORDER_STATUSES.find((s) => s.value === order.status);
              return (
                <tr key={order.id} className="hover:bg-indigo-950">
                  <td className="py-3 pr-4 font-medium text-white">
                    #{order.order_number}
                  </td>
                  <td className="py-3 pr-4 text-cream-300">
                    <p>{order.customer_name}</p>
                    <p className="text-xs text-neutral-600">{order.customer_phone}</p>
                  </td>
                  <td className="py-3 pr-4 text-cream-300">
                    {order.fulfillment_type === "PICKUP" ? "Pickup" : "Delivery"}
                  </td>
                  <td className="py-3 pr-4">
                    <OrderStatusControls
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                    <span className={`text-xs ${status?.color ?? "text-cream-300"}`}>
                      {status?.label ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-white">
                    {formatPrice(Number(order.total), order.currency ?? "KES")}
                  </td>
                  <td className="py-3 text-cream-300">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}