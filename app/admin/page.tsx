import Link from "next/link";
import { getAdminClient } from "lib/insforge/admin";
import { BarChart } from "components/charts/bar-chart";
import { formatPrice } from "lib/utils";
import { ORDER_STATUSES } from "lib/constants";

export const metadata = {
  title: "Admin Overview",
};

type Stats = {
  today: { aov: number; orders: number; revenue: number; customers: number };
  deltas: { aov: number; orders: number; revenue: number; customers: number };
  currency: string;
  orders_series: { date: string; value: number }[];
};

export default async function AdminPage() {
  const admin = getAdminClient();

  const [statsRes, topRes, countsRes] = await Promise.all([
    admin.database.rpc("dashboard_stats"),
    admin.database.rpc("top_products", { p_days: 30, p_limit: 6 }),
    admin.database.rpc("order_status_counts"),
  ]);

  const stats = (statsRes.data ?? {}) as Stats;
  const topProducts = (topRes.data ?? []) as { name: string; total: number }[];
  const statusCounts = (countsRes.data ?? {}) as Record<string, number>;

  const cards = [
    {
      label: "Revenue today",
      value: formatPrice(stats.today?.revenue ?? 0, stats.currency ?? "KES"),
      sub: stats.deltas?.revenue ?? 0,
    },
    {
      label: "Orders today",
      value: String(stats.today?.orders ?? 0),
      sub: stats.deltas?.orders ?? 0,
    },
    {
      label: "Average order value",
      value: formatPrice(stats.today?.aov ?? 0, stats.currency ?? "KES"),
      sub: stats.deltas?.aov ?? 0,
    },
    {
      label: "New customers today",
      value: String(stats.today?.customers ?? 0),
      sub: stats.deltas?.customers ?? 0,
    },
  ];

  const series = (stats.orders_series ?? []).map((p) => ({
    label: p.date.slice(5),
    value: p.value,
  }));

  const plot = new Map<string, number>(ORDER_STATUSES.map((s) => [s.value, 0]));
  for (const [status, count] of Object.entries(statusCounts)) {
    plot.set(status, count);
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-indigo-line bg-indigo-950 p-5"
          >
            <p className="text-xs uppercase tracking-wide text-neutral-600">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
            <p
              className={
                card.sub > 0
                  ? "mt-1 text-xs text-green-400"
                  : card.sub < 0
                    ? "mt-1 text-xs text-red-400"
                    : "mt-1 text-xs text-neutral-600"
              }
            >
              {card.sub > 0 ? "▲" : "▼"} {Math.abs(card.sub)} vs yesterday
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="rounded-2xl border border-indigo-line bg-indigo-950 p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-medium text-white">
            Orders, last 30 days
          </h2>
          <BarChart data={series} format={(v) => String(v)} />
        </div>

        <div className="rounded-2xl border border-indigo-line bg-indigo-950 p-6">
          <h2 className="mb-4 text-lg font-medium text-white">Orders by status</h2>
          <ul className="space-y-3">
            {ORDER_STATUSES.map((s) => {
              const count = plot.get(s.value) ?? 0;
              if (count === 0) return null;
              return (
                <li key={s.value} className="flex items-center justify-between">
                  <span className="text-sm text-cream-300">{s.label}</span>
                  <span className={`text-sm font-medium ${s.color}`}>{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-line bg-indigo-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Top products (30 days)</h2>
          <Link
            href="/admin/products"
            className="text-sm text-[var(--color-gold-400)] hover:underline"
          >
            Manage products →
          </Link>
        </div>
        {topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-600">
            No sales yet — orders placed will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {topProducts.map((p, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <span className="text-sm text-white">
                  {i + 1}. {p.name}
                </span>
                <span className="text-sm text-cream-300">{p.total} sold</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}