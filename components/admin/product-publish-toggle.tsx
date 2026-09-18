"use client";

import { useTransition } from "react";
import { toggleProductPublish } from "app/admin/actions";

export function ProductPublishToggle({
  productId,
  published,
}: {
  productId: string;
  published: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleProductPublish(productId, !published);
        })
      }
      aria-pressed={published}
      className={
        published
          ? "rounded-full border border-green-500/40 bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-400 disabled:opacity-50"
          : "rounded-full border border-neutral-700 px-4 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-white disabled:opacity-50"
      }
    >
      {isPending ? "…" : published ? "Published" : "Draft"}
    </button>
  );
}