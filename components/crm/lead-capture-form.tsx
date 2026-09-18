"use client";

import { useState } from "react";

type LeadCaptureProps = {
  variant?: "recipe" | "product" | "checkout" | "catering" | "general";
  title?: string;
  description?: string;
  source?: string;
  onSuccess?: () => void;
};

export function LeadCaptureForm({
  variant = "general",
  title,
  description,
  source = "DIRECT",
  onSuccess,
}: LeadCaptureProps) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", whatsapp: "",
    consent_marketing: false, consent_whatsapp: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const titles: Record<string, string> = {
    recipe: "Get this recipe on WhatsApp",
    product: "Need help choosing?",
    checkout: "Complete your order",
    catering: "Plan your event",
    general: "Stay in touch",
  };

  const descriptions: Record<string, string> = {
    recipe: "We'll send the full recipe with tips straight to your WhatsApp.",
    product: "Our team can help you pick the right ingredients.",
    checkout: "Your cart is waiting. Need any help?",
    catering: "Tell us about your event and we'll get back to you.",
    general: "Get updates on new recipes, deals and Swahili dishes.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/crm/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source,
          consent_marketing: form.consent_marketing,
          consent_whatsapp: form.consent_whatsapp,
          preferred_contact: form.whatsapp ? "whatsapp" : form.phone ? "phone" : "email",
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setStatus("success");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="text-sm font-medium text-green-400">Thank you! We'll be in touch.</p>
      </div>
    );
  }

  const inputBase = "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[var(--color-gold-400)]";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <h3 className="text-base font-medium text-white" style={{ fontFamily: "var(--font-display)" }}>
        {title || titles[variant]}
      </h3>
      <p className="mt-1 text-sm text-neutral-400">
        {description || descriptions[variant]}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputBase}
        />
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputBase}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputBase}
          />
          <input
            type="tel"
            placeholder="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className={inputBase}
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={form.consent_whatsapp}
            onChange={(e) => setForm({ ...form, consent_whatsapp: e.target.checked })}
            className="mt-0.5"
          />
          I agree to receive WhatsApp messages
        </label>
        <label className="flex items-start gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={form.consent_marketing}
            onChange={(e) => setForm({ ...form, consent_marketing: e.target.checked })}
            className="mt-0.5"
          />
          I agree to receive email updates
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-[var(--color-gold-400)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
