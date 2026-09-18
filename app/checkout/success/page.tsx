import Link from "next/link";
import { getAdminClient } from "lib/insforge/admin";
import { notFound } from "next/navigation";
import { formatPrice } from "lib/utils";

export const metadata = {
  title: "Order Confirmed",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const orderId = typeof params?.order === "string" ? params.order : null;
  if (!orderId) return notFound();

  const { data: order } = await getAdminClient().database
    .from("orders")
    .select("order_number, total, status, payment_method, currency, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return notFound();

  const isCod = order.payment_method === "COD";

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gold-400)]/15">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="var(--color-gold-400)"
          className="h-8 w-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-white">Order confirmed</h1>
      <p className="mt-2 text-neutral-500">
        Thanks! Your order <span className="font-medium text-white">#{order.order_number}</span>{" "}
        has been placed. Total{" "}
        <span className="font-medium text-white">
          {formatPrice(Number(order.total), order.currency ?? "KES")}
        </span>
        .
      </p>

      <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-neutral-400">
        {isCod ? (
          <p>
            You chose <span className="font-medium text-white">Cash on Delivery</span>. Have
            the exact amount ready when your order arrives.
          </p>
        ) : (
          <p>
            You chose{" "}
            <span className="font-medium text-white">{order.payment_method}</span>. Complete
            payment to confirm your order — check your phone for the M-Pesa prompt, or
            finish the card payment in the secure window.
          </p>
        )}
      </div>

      <div className="mt-10 flex justify-center gap-3">
        <Link
          href="/menu"
          className="rounded-full border border-neutral-800 px-6 py-3 text-sm text-neutral-400 transition hover:border-[var(--color-gold-400)] hover:text-white"
        >
          Order more
        </Link>
        <Link
          href="/account"
          className="rounded-full bg-[var(--color-gold-400)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Track your order
        </Link>
      </div>
    </div>
  );
}