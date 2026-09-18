"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { removeItem } from "components/cart/actions";
import type { CartItem } from "lib/insforge/types";
import { useActionState } from "react";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: (itemId: string, updateType: "delete") => void;
}) {
  const [message, formAction] = useActionState(removeItem, null);
  const removeItemAction = formAction.bind(null, {
    cartId: item.cart_id,
    itemId: item.id,
  });

  return (
    <form
      action={async () => {
        optimisticUpdate(item.id, "delete");
        removeItemAction();
      }}
    >
      <button
        type="submit"
        aria-label="Remove cart item"
        className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-neutral-500"
      >
        <XMarkIcon className="mx-[1px] h-4 w-4 text-white dark:text-black" />
      </button>
      <p aria-live="polite" className="sr-only" role="status">
        {message && (message as any)?.error ? (message as any).error : ""}
      </p>
    </form>
  );
}
