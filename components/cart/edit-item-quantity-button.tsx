"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { updateItemQuantity } from "components/cart/actions";
import type { CartItem } from "lib/insforge/types";
import { useActionState } from "react";

function SubmitButton({ type }: { type: "plus" | "minus" }) {
  return (
    <button
      type="submit"
      aria-label={type === "plus" ? "Increase item quantity" : "Reduce item quantity"}
      className={clsx(
        "ease flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full p-2 transition-all duration-200 hover:border-indigo-line hover:opacity-80",
        { "ml-auto": type === "minus" },
      )}
    >
      {type === "plus" ? (
        <PlusIcon className="h-4 w-4 dark:text-cream-300" />
      ) : (
        <MinusIcon className="h-4 w-4 dark:text-cream-300" />
      )}
    </button>
  );
}

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate,
}: {
  item: CartItem;
  type: "plus" | "minus";
  optimisticUpdate: (itemId: string, updateType: "plus" | "minus") => void;
}) {
  const newQuantity = type === "plus" ? item.quantity + 1 : item.quantity - 1;
  const [message, formAction] = useActionState(updateItemQuantity, null);

  const updateItemQuantityAction = formAction.bind(null, {
    cartId: item.cart_id,
    itemId: item.id,
    quantity: newQuantity,
  });

  return (
    <form
      action={async () => {
        optimisticUpdate(item.id, type);
        updateItemQuantityAction();
      }}
    >
      <SubmitButton type={type} />
      <p aria-live="polite" className="sr-only" role="status">
        {message && (message as any)?.error ? (message as any).error : ""}
      </p>
    </form>
  );
}
