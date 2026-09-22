"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "components/cart/actions";
import type { Product, ProductVariant } from "lib/insforge/types";
import { useSearchParams } from "next/navigation";
import { useCart } from "./cart-context";
import { useState, useTransition } from "react";

function buildVariantOptionMap(variant: ProductVariant): Record<string, string> {
  if (variant.options) return variant.options;
  return { portion: variant.title };
}

function findVariantFromParams(
  variants: ProductVariant[],
  searchParams: URLSearchParams
): ProductVariant | null {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0] ?? null;

  for (const v of variants) {
    const opts = buildVariantOptionMap(v);
    let match = true;
    for (const [key, val] of Object.entries(opts)) {
      if (searchParams.get(key.toLowerCase()) !== val) {
        match = false;
        break;
      }
    }
    if (match) return v;
  }
  return null;
}

function SubmitButton({
  isAvailable,
  hasVariant,
}: {
  isAvailable: boolean;
  hasVariant: boolean;
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

  return (
    <button
      type="submit"
      aria-label="Add to cart"
      className={clsx(buttonClasses, "hover:opacity-90")}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      {!hasVariant ? "Select an option" : "Add To Cart"}
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
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const variantList = (variants as ProductVariant[]) ?? [];

  // Determine the active variant: prop > URL params > single-variant auto-select
  const variant =
    selectedVariant ??
    (variantList.length > 0 ? findVariantFromParams(variantList, searchParams) : null) ??
    (variantList.length === 1 ? variantList[0] : null);

  const isAvailable = is_available ?? true;
  const hasVariant = !!variant;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!variant) return;

    // Optimistic UI update
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

    // Fire server action (non-blocking)
    startTransition(() => {
      addItem(null, {
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
        unitPrice: variant.price ?? product.price,
      }).catch(() => {});
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SubmitButton isAvailable={isAvailable} hasVariant={hasVariant} />
    </form>
  );
}
