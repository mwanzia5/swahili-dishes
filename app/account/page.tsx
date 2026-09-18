/* ==========================================================
   BAHARI TAMU — Swahili Coastal Kitchen Account Page
   ========================================================== */

import { redirect } from "next/navigation";
import { signOut, getSessionUser } from "app/auth/actions";
import { getAdminClient } from "lib/insforge/admin";
import { formatPrice, formatDate } from "lib/utils";
import Link from "next/link";
import { ORDER_STATUSES } from "lib/constants";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: string | number;
  currency: string;
  created_at: string;
  paid_at: string | null;
  order_items?: OrderItem[];
}

interface Profile {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUSES.find((o) => o.value === status);
  return (
    <span
      className={`inline-flex rounded-full border border-current px-2 py-0.5 text-xs ${
        s?.color ?? "text-neutral-500"
      }`}
    >
      {s?.label ?? status}
    </span>
  );
}

function formatStatusClass(status: string) {
  const mapping: Record<string, string> = {
    PREPARING: "status-preparing",
    OUT_FOR_DELIVERY: "status-onway",
    DELIVERED: "status-delivered",
    CANCELLED: "status-cancelled",
    REFUNDED: "status-cancelled",
  };
  return mapping[status] ?? "";
}

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const admin = getAdminClient();

  const [ordersResult, profileResult] = await Promise.all([
    admin.database
      .from("orders")
      .select("id, order_number, status, total, currency, created_at, paid_at, order_items(id, product_id, product_name, quantity, unit_price, notes)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.database
      .from("profiles")
      .select("id, full_name, phone, email, created_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const orders: Order[] = ordersResult.data ?? [];
  const profile: Profile | null = profileResult.data ?? null;

  // Calculate stats
  const totalSpent = orders
    .filter((o) => o.status === "DELIVERED" || o.status === "REFUNDED")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;
  
  const mostOrdered = orders.flatMap((o) => (o.order_items ?? [])).reduce((acc, item) => {
    acc[item.product_name] = (acc[item.product_name] ?? 0) + (item.quantity ?? 1);
    return acc;
  }, {} as Record<string, number>);

  const topDish = Object.entries(mostOrdered).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
            {profile?.full_name ?? "My Account"}
          </h1>
          <p className="mt-1 text-sm text-cream-300">
            {profile?.email ?? user.email}
            {profile?.phone ? ` · ${profile.phone}` : ""}
          </p>
        </div>
        <form action={signOut} className="inline">
          <button
            type="submit"
            className="btn btn-outline"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="account-stats" style={{ marginBottom: "26px" }}>
            <div className="stat-card">
              <strong>{totalOrders}</strong>
              <span>Orders placed</span>
            </div>
            <div className="stat-card">
              <strong>{formatPrice(totalSpent)}</strong>
              <span>Total spent</span>
            </div>
            <div className="stat-card">
              <strong>{topDish}</strong>
              <span>Most ordered dish</span>
            </div>
          </div>

          <div className="section-head" style={{ marginBottom: "26px" }}>
            <div>
              <span className="kicker">Your orders</span>
              <h2 style={{ marginBottom: 0 }}>Order history</h2>
            </div>
            <div className="category-rail" style={{ marginBottom: 0 }}>
              <button className="cat-pill active" data-category="all">All</button>
              <button className="cat-pill" data-category="active">Active</button>
              <button className="cat-pill" data-category="delivered">Delivered</button>
              <button className="cat-pill" data-category="cancelled">Cancelled</button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-indigo-line bg-indigo-800 p-6 text-cream-300">
              <p>No orders yet.</p>
              <Link
                href="/menu"
                className="btn btn-primary mt-3 inline-block"
              >
                Browse the menu →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((order, index) => (
                <article key={order.id} className="order-card">
                  <div className="order-head">
                    <div className="order-head-left">
                      <span className="order-id">Order #{order.order_number}</span>
                      <span className="order-date">{formatDate(order.created_at)}</span>
                    </div>
                    <span className={`status-pill ${formatStatusClass(order.status)}`}>
                      {ORDER_STATUSES.find((s) => s.value === order.status)?.label ?? order.status}
                    </span>
                  </div>
                  <div className="order-items">
                    {order.order_items?.map((item: OrderItem, itemIdx: number) => (
                      <div key={itemIdx} className="order-item-row">
                        <div className="order-item-thumb">
                          <img
                            src="/placeholder-150x150.png"
                            alt={item.product_name}
                          />
                        </div>
                        <div className="order-item-info">
                          <h4>{item.product_name}</h4>
                          <span>Qty {item.quantity} · {item.notes || ""}</span>
                        </div>
                        <div className="order-item-price">{formatPrice(Number(item.unit_price), order.currency ?? "KES")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="order-foot">
                    <span className="order-total">Total: {formatPrice(Number(order.total), order.currency ?? "KES")}</span>
                    <div className="order-track">
                      {order.status === "OUT_FOR_DELIVERY" || order.status === "PREPARING" ? (
                        <>
                          <a href="#" className="btn btn-outline btn-small">Track order</a>
                          <a href="/contact" className="btn btn-outline btn-small">Get help</a>
                        </>
                      ) : order.status === "DELIVERED" ? (
                        <>
                          <a href="/menu" className="btn btn-primary btn-small">Reorder</a>
                          <a href="#" className="btn btn-outline btn-small">View receipt</a>
                        </>
                      ) : order.status === "CANCELLED" ? (
                        <a href="/menu" className="btn btn-outline btn-small">Order again</a>
                      ) : (
                        <a href="/contact" className="btn btn-outline btn-small">Get help</a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar placeholder for future tabs */}
        <div>
          <div className="rounded-xl border border-indigo-line bg-indigo-800 p-6 text-cream-300">
            <p>Order details and account settings coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}