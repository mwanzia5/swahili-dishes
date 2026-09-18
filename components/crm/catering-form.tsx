"use client";

import { useState } from "react";

type CateringFormProps = {
  onSuccess?: () => void;
};

export function CateringInquiryForm({ onSuccess }: CateringFormProps) {
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", email: "",
    event_type: "Wedding", event_date: "", guest_count: "",
    location: "", preferred_cuisine: "", estimated_budget: "",
    additional_requirements: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/crm/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guest_count: parseInt(form.guest_count) || 0,
          estimated_budget: parseFloat(form.estimated_budget) || undefined,
          event_date: form.event_date || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
        <h3 className="text-lg font-medium text-green-400">Inquiry Received!</h3>
        <p className="mt-2 text-sm text-neutral-400">
          We&apos;ll review your catering request and get back to you within 24 hours.
        </p>
      </div>
    );
  }

  const inputBase = "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[var(--color-gold-400)]";
  const label = "mb-1 block text-xs text-neutral-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Full Name *</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputBase} />
        </div>
        <div>
          <label className={label}>Phone *</label>
          <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputBase} placeholder="+254 712 345 678" />
        </div>
        <div>
          <label className={label}>WhatsApp</label>
          <input type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputBase} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputBase} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Event Type *</label>
          <select required value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className={inputBase}>
            <option>Wedding</option>
            <option>Birthday</option>
            <option>Corporate Event</option>
            <option>Conference</option>
            <option>Party</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className={label}>Event Date</label>
          <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className={inputBase} />
        </div>
        <div>
          <label className={label}>Number of Guests *</label>
          <input type="number" required min="1" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} className={inputBase} />
        </div>
        <div>
          <label className={label}>Location *</label>
          <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputBase} placeholder="City / Venue" />
        </div>
        <div>
          <label className={label}>Preferred Cuisine</label>
          <input type="text" value={form.preferred_cuisine} onChange={(e) => setForm({ ...form, preferred_cuisine: e.target.value })} className={inputBase} placeholder="e.g. Swahili, Biryani" />
        </div>
        <div>
          <label className={label}>Estimated Budget (KES)</label>
          <input type="number" min="0" value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} className={inputBase} />
        </div>
      </div>

      <div>
        <label className={label}>Additional Requirements</label>
        <textarea
          value={form.additional_requirements}
          onChange={(e) => setForm({ ...form, additional_requirements: e.target.value })}
          className={`${inputBase} h-24 resize-none`}
          placeholder="Dietary restrictions, special requests, etc."
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-[var(--color-gold-400)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting..." : "Submit Catering Inquiry"}
      </button>
    </form>
  );
}
