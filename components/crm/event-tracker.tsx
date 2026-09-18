"use client";

import { useEffect, useRef } from "react";

function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("sd_anonymous_id");
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("sd_anonymous_id", id);
  }
  return id;
}

export function trackEvent(eventType: string, metadata?: Record<string, unknown>, contentId?: string, contentType?: string) {
  const anonymousId = getAnonymousId();
  if (!anonymousId) return;

  fetch("/api/crm/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      anonymous_id: anonymousId,
      metadata: metadata || {},
      content_id: contentId || null,
      content_type: contentType || null,
    }),
  }).catch(() => {});
}

export function usePageViewTracker(pageType?: string, pageId?: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    trackEvent("PAGE_VIEW", {
      page_type: pageType || "unknown",
      path: window.location.pathname,
    }, pageId, pageType);
  }, [pageType, pageId]);
}

export function useProductViewTracker(productId: string, productName?: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !productId) return;
    tracked.current = true;

    trackEvent("PRODUCT_VIEW", {
      product_name: productName,
    }, productId, "product");
  }, [productId, productName]);
}

export function useRecipeViewTracker(recipeId: string, recipeTitle?: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !recipeId) return;
    tracked.current = true;

    trackEvent("RECIPE_VIEW", {
      recipe_title: recipeTitle,
    }, recipeId, "recipe");
  }, [recipeId, recipeTitle]);
}
