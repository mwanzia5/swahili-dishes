"use client";

import { useActionState } from "react";
import { updateOrderStatus } from "app/admin/actions";
import { ORDER_STATUSES } from "lib/constants";

export function OrderStatusControls({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      const result = await updateOrderStatus(
        orderId,
        String(formData.get("status") ?? currentStatus),
      );
      return result;
    },
    { error: "" },
  );

  return (
    <form action={formAction} className="contents">
      <select
        name="status"
        defaultValue={currentStatus}
        aria-label="Update status"
        className="mb-1 w-full rounded-lg border border-indigo-line bg-indigo-800 px-2 py-1.5 text-xs text-white outline-none focus:border-[var(--color-gold-400)]"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-indigo-line px-3 py-1 text-xs text-cream-300 transition hover:border-[var(--color-gold-400)] hover:text-white disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Update"}
      </button>
      {state?.error ? (
        <p className="mt-1 text-xs text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}