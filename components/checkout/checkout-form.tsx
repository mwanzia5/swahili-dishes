"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitOrder } from "app/checkout/actions";
import type { CheckoutResult } from "app/checkout/actions";
import { PAYMENT_METHODS } from "lib/payments";

const inputBase =
  "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-cream-300/50 outline-none transition focus:border-[var(--color-gold-400)]";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm text-neutral-400">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

export default function CheckoutForm({ hasAccount }: { hasAccount: boolean }) {
  const router = useRouter();
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [method, setMethod] = useState<"MPESA" | "CARD" | "COD">("COD");

  const [state, formAction, isPending] = useActionState<CheckoutResult | undefined, FormData>(
    async (prev, formData) => {
      const result = await submitOrder(prev, formData);
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return { ...result, redirectTo: undefined };
      }
      return result;
    },
    undefined,
  );

  const fieldError = (key: string) => {
    if (state?.fieldErrors?.[key]) {
      return <p className="mt-1 text-sm text-red-400">{state.fieldErrors[key]}</p>;
    }
    return null;
  };

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-lg font-medium text-white">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={state?.fieldErrors?.name}>
            <input id="name" name="name" type="text" autoComplete="name" className={inputBase} placeholder="Ali Hassan" required />
          </Field>
          <Field label="Phone" htmlFor="phone" error={state?.fieldErrors?.phone}>
            <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputBase} placeholder="0712 345 678" required />
          </Field>
        </div>
        <Field label="Email (optional)" htmlFor="email" error={state?.fieldErrors?.email}>
          <input id="email" name="email" type="email" autoComplete="email" className={inputBase} placeholder="you@example.com" />
        </Field>
        {!hasAccount && (
          <p className="text-xs text-neutral-600">
            Checking out as a guest.{" "}
            <Link href="/login" className="text-neutral-400 underline underline-offset-4 hover:text-white">
              Sign in
            </Link>{" "}
            to track orders.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Delivery</h2>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["DELIVERY", "PICKUP"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFulfillment(f)}
              className={
                fulfillment === f
                  ? "rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-400)]/10 px-4 py-2 text-sm text-white"
                  : "rounded-full border border-neutral-800 px-4 py-2 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              }
            >
              {f === "DELIVERY" ? "Delivery" : "Pickup"}
            </button>
          ))}
        </div>

        {fulfillment === "DELIVERY" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Field label="County" htmlFor="county" error={state?.fieldErrors?.county}>
                  <input id="county" name="county" type="text" className={inputBase} placeholder="Nairobi" />
                </Field>
              </div>
              <div>
                <Field label="Area" htmlFor="area" error={state?.fieldErrors?.area}>
                  <input id="area" name="area" type="text" className={inputBase} placeholder="Kilimani" />
                </Field>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Estate / Building" htmlFor="estate">
                <input id="estate" name="estate" type="text" className={inputBase} placeholder="Ole Santur" />
              </Field>
              <Field label="Street" htmlFor="street">
                <input id="street" name="street" type="text" className={inputBase} placeholder="Lenana Road" />
              </Field>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Pickup is at our Nairobi location. We&apos;ll confirm the pickup time by
            phone once your order is ready.
          </p>
        )}

        <input type="hidden" name="fulfillmentType" value={fulfillment} />

        <div className="mt-4">
          <Field label="Delivery instructions (optional)" htmlFor="instructions">
            <textarea id="instructions" name="instructions" rows={2} className={inputBase} placeholder="Gate code, landmark, etc." />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Payment</h2>
        <div className="space-y-2" role="radiogroup" aria-label="Payment method">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.value}
              className={
                method === m.value
                  ? "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-gold-400)] bg-[var(--color-gold-400)]/5 p-4"
                  : "flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-800 p-4 transition hover:border-neutral-700"
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m.value}
                checked={method === m.value}
                onChange={() => setMethod(m.value)}
                className="mt-1 h-4 w-4 accent-[var(--color-gold-400)]"
              />
              <div>
                <p className="text-sm font-medium text-white">{m.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{m.description}</p>
                {m.requiresConfig && <p className="mt-1 text-xs text-yellow-500">Coming soon — not available yet.</p>}
              </div>
            </label>
          ))}
        </div>
        {state?.fieldErrors?.paymentMethod ? (
          <p className="mt-3 text-sm text-red-400">{state.fieldErrors.paymentMethod}</p>
        ) : null}
      </section>

      {state?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--color-gold-400)] px-6 py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Placing your order..." : "Place order"}
      </button>
    </form>
  );
}