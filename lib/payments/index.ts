export type PaymentMethod = "MPESA" | "CARD" | "COD";

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
  requiresConfig: boolean;
}[] = [
  {
    value: "MPESA",
    label: "M-Pesa (M-PESA)",
    description: "Pay with M-Pesa STK push. Enter your phone number below.",
    requiresConfig: true,
  },
  {
    value: "CARD",
    label: "Card",
    description: "Pay securely with Visa / Mastercard via Stripe.",
    requiresConfig: true,
  },
  {
    value: "COD",
    label: "Cash on Delivery",
    description: "Pay in cash when your order arrives.",
    requiresConfig: false,
  },
];

export function isMpesaConfigured(): boolean {
  return Boolean(
    process.env.DARAJAA_CONSUMER_KEY &&
      process.env.DARAJAA_CONSUMER_SECRET &&
      process.env.DARAJAA_PASSKEY &&
      process.env.DARAJAA_SHORTCODE,
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function paymentMethodAvailable(method: PaymentMethod): boolean {
  if (method === "MPESA") return isMpesaConfigured();
  if (method === "CARD") return isStripeConfigured();
  return true;
}

export function availablePaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter((m) => paymentMethodAvailable(m.value)).map(
    (m) => m.value,
  );
}