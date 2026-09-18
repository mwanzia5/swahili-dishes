"use client";

import { useEffect } from "react";
import { trackCheckoutStart } from "./abandoned-cart";
import { trackEvent } from "./event-tracker";

export function CheckoutTracker() {
  useEffect(() => {
    trackCheckoutStart();
    trackEvent("CHECKOUT_STARTED", {
      path: window.location.pathname,
    });
  }, []);

  return null;
}
