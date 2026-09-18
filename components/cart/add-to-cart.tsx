"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "components/cart/actions";
import type { Product, ProductVariant } from "lib/insforge/types";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useCart } from "./cart-context";

function SubmitButton({
  isAvailable,
  selectedVariantId,
}: {
  isAvailable: boolean;
  selectedVariantId: string | undefined;
}) {
  const buttonClasses =
    "relative flex w-full items-center justify-center rounded-full bg-[var(--color-gold-400)] p-4 tracking-wide text-white font-medium";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!isAvailable) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Out Of Stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Please select an option"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        <div className="absolute left-0 ml-4">
          <PlusIcon className="h-5" />
        </div>
        Add To Cart
      </button>
    );
  }

  return (
    <button
      aria-label="Add to cart"
      className={clsx(buttonClasses, "hover:opacity-90")}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  );
}

export function AddToCart({
  product,
  selectedVariant,
}: {
  product: Product;
  selectedVariant?: ProductVariant | null;
}) {
  const { variants, is_available } = product;
  const { addCartItem } = useCart();
  const [message, formAction] = useActionState(addItem, null);

  const variantList = (variants as ProductVariant[]) ?? [];
  const defaultVariant = variantList.length === 1 ? variantList[0] : null;
  const variant = selectedVariant ?? defaultVariant;

  const addItemAction = formAction.bind(null, {
    productId: product.id,
    variantId: variant?.id,
    unitPrice: variant?.price ?? product.price,
    quantity: 1,
  });

  const isAvailable = is_available ?? true;

  return (
    <form
      action={async () => {
        addItemAction();
        if (variant) {
          addCartItem({
            id: `optimistic-${Date.now()}`,
            cart_id: "",
            product_id: product.id,
            variant_id: variant.id ?? null,
            quantity: 1,
            unit_price: variant.price ?? product.price,
            extras: [],
            notes: null,
            created_at: new Date().toISOString(),
          });
        }
      }}
    >
      <SubmitButton
        isAvailable={isAvailable}
        selectedVariantId={variant?.id}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {message && (message as any)?.error ? (message as any).error : ""}
      </p>
    </form>
  );
}
