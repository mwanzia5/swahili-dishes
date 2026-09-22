import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { getAdminClient } from "lib/insforge/admin";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const nav = [
  { title: "Overview", path: "/admin" },
  { title: "Orders", path: "/admin/orders" },
  { title: "Products", path: "/admin/products" },
  { title: "Leads & CRM", path: "/admin/leads" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const client = createServerClient({ cookies: await cookies() });
  const { data, error } = await client.auth.getCurrentUser();

  if (error || !data?.user) redirect("/login?next=/admin");

  const admin = getAdminClient();
  const { data: profile } = await admin.database
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== "ADMIN" && role !== "STAFF") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-white">Admin only</h1>
        <p className="mt-2 text-cream-300">
          This area is restricted to store staff. If you believe this is a
          mistake, contact the store owner.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-indigo-line px-6 py-3 text-sm text-cream-300 hover:text-white"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin</h1>
          <p className="mt-1 text-sm text-cream-300">
            {profile?.full_name ?? "Staff"} · {role}
          </p>
        </div>
      </header>

      <nav className="mb-8 flex gap-2" aria-label="Admin sections">
        {nav.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="rounded-full border border-indigo-line px-4 py-1.5 text-sm text-cream-300 transition hover:border-[var(--color-gold-400)] hover:text-white"
          >
            {item.title}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}