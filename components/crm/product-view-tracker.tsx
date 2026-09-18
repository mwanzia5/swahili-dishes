"use client";

import { useProductViewTracker } from "./event-tracker";

export function ProductViewTracker({ productId, productName }: { productId: string; productName: string }) {
  useProductViewTracker(productId, productName);
  return null;
}
