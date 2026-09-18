"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import {
  toggleFavourite,
  type FavouriteResult,
} from "app/favourites/actions";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function FavouriteButton({
  productId,
  initialFavourite = false,
}: {
  productId: string;
  initialFavourite?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [favourited, setFavourited] = useState(initialFavourite);
  const [error, setError] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showTemporaryMessage(msg: string) {
    setError(msg);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setError(null), 2500);
  }

  function handleClick() {
    startTransition(async () => {
      const result: FavouriteResult = await toggleFavourite(productId);
      if (result.error) {
        showTemporaryMessage(result.error);
        return;
      }
      setFavourited(result.fav);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={favourited}
        aria-label={favourited ? "Remove from favourites" : "Save to favourites"}
        className={
          favourited
            ? "mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-400)]/10 px-4 py-3 text-sm font-medium text-[var(--color-gold-400)] transition hover:opacity-90 disabled:opacity-50"
            : "mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-800 px-4 py-3 text-sm text-neutral-400 transition hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-400)] disabled:opacity-50"
        }
      >
        <HeartIcon className={`h-5 ${favourited ? "fill-current" : ""}`} />
        {isPending
          ? "Saving…"
          : favourited
            ? "Saved to favourites"
            : "Save to favourites"}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}