"use client";

import { useEffect, useRef } from "react";

const CHECKOUT_ABANDONMENT_DELAY = 30 * 60 * 1000; // 30 minutes

export function AbandonedCartDetector() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user has items in cart (from localStorage or cookie)
    const checkAbandonment = () => {
      const checkoutStarted = sessionStorage.getItem("sd_checkout_started");
      const checkoutCompleted = sessionStorage.getItem("sd_checkout_completed");

      if (checkoutStarted && !checkoutCompleted) {
        const startTime = parseInt(checkoutStarted);
        const elapsed = Date.now() - startTime;

        if (elapsed >= CHECKOUT_ABANDONMENT_DELAY) {
          // Track abandonment
          fetch("/api/crm/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_type: "CHECKOUT_ABANDONED",
              metadata: {
                time_in_checkout: Math.round(elapsed / 1000),
                path: window.location.pathname,
              },
            }),
          }).catch(() => {});

          sessionStorage.removeItem("sd_checkout_started");
        }
      }
    };

    // Check periodically
    timerRef.current = setInterval(checkAbandonment, 60_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return null;
}

export function trackCheckoutStart() {
  if (typeof window !== "undefined" && !sessionStorage.getItem("sd_checkout_started")) {
    sessionStorage.setItem("sd_checkout_started", Date.now().toString());
  }
}

export function trackCheckoutComplete() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("sd_checkout_started");
    sessionStorage.setItem("sd_checkout_completed", "true");
  }
}
