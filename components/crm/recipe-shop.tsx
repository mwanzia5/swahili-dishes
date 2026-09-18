"use client";

import { useState } from "react";
import { trackEvent } from "./event-tracker";

type Ingredient = {
  name: string;
  quantity: string;
  product_id: string | null;
  product_name: string | null;
  product_price: number | null;
  product_slug: string | null;
  image_url: string | null;
};

type RecipeShopProps = {
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
  ingredients: Ingredient[];
};

export function RecipeShopSection({ recipeId, recipeSlug, recipeTitle, ingredients }: RecipeShopProps) {
  const linkedIndices = ingredients
    .map((ing, i) => (ing.product_id ? i : -1))
    .filter((i) => i >= 0);

  const [selected, setSelected] = useState<Set<number>>(
    new Set(linkedIndices)
  );
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const linkedIngredients = linkedIndices.map((i) => ingredients[i]!);
  const totalPrice = linkedIngredients
    .filter((_, i) => selected.has(linkedIndices[i]!))
    .reduce((sum, ing) => sum + (ing.product_price || 0), 0);

  function toggle(linkedIdx: number) {
    const realIndex = linkedIndices[linkedIdx]!;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(realIndex)) next.delete(realIndex);
      else next.add(realIndex);
      return next;
    });
  }

  async function addAllToCart() {
    setAdding(true);
    try {
      const selectedIds = linkedIngredients
        .filter((_, i) => selected.has(linkedIndices[i]!))
        .map((ing) => ing.product_id)
        .filter(Boolean) as string[];

      for (const productId of selectedIds) {
        await fetch("/api/crm/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "ADD_TO_CART",
            metadata: { recipe_id: recipeId, recipe_title: recipeTitle, source: "recipe_shop" },
            content_id: productId,
            content_type: "product",
          }),
        });
      }

      setAdded(true);
      trackEvent("RECIPE_DOWNLOAD", { recipe_id: recipeId, recipe_title: recipeTitle, items_added: selectedIds.length });
    } finally {
      setAdding(false);
    }
  }

  if (linkedIngredients.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-white" style={{ fontFamily: "var(--font-display)" }}>
          Shop This Recipe
        </h3>
        <span className="text-sm text-gold-400">KES {totalPrice.toLocaleString()}</span>
      </div>

      <div className="space-y-2">
        {linkedIngredients.map((ing, i) => (
          <label
            key={i}
            className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700"
          >
            <input
              type="checkbox"
              checked={selected.has(linkedIndices[i]!)}
              onChange={() => toggle(i)}
              className="accent-[var(--color-gold-400)]"
            />
            <div className="flex-1">
              <span className="text-sm text-white">{ing.product_name || ing.name}</span>
              {ing.quantity && <span className="ml-2 text-xs text-neutral-500">({ing.quantity})</span>}
            </div>
            {ing.product_price && (
              <span className="text-sm text-neutral-400">KES {ing.product_price.toLocaleString()}</span>
            )}
          </label>
        ))}
      </div>

      <button
        onClick={addAllToCart}
        disabled={adding || selected.size === 0 || added}
        className="mt-4 w-full rounded-full bg-[var(--color-gold-400)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {added ? "Added to Cart!" : adding ? "Adding..." : `Add ${selected.size} Items to Cart`}
      </button>
    </div>
  );
}
