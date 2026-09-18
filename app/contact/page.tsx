import { ContactForm } from "components/layout/contact-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Bahari Tamu — questions, reservations, or just say karibu.",
};

export default function ContactPage() {
  return (
    <div>
      {/* Page header */}
      <section
        className="py-16"
        style={{ borderBottom: "1px solid var(--color-indigo-line)", background: "radial-gradient(ellipse at 80% 0%, rgba(226,161,58,.10), transparent 55%)" }}
      >
        <div className="mx-auto max-w-[1180px] px-8">
          <p className="mb-[14px] text-[0.82rem] text-cream-300">
            <a href="/" className="text-gold-400">Home</a> / <span>Contact</span>
          </p>
          <h1 className="mb-[10px] text-[clamp(2.4rem,4.2vw,3.8rem)] font-medium text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
            Get in touch, or come by
          </h1>
          <p className="mx-auto max-w-xl text-cream-300">
            Questions about an order, a private booking, or just want to say karibu — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto grid max-w-[1180px] gap-[60px] px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">

          {/* Left column: info cards */}
          <div>
            {/* Visit us card */}
            <div className="mb-[22px] rounded-lg border border-indigo-line bg-indigo-800 p-[34px]">
              <h3 className="mb-4 text-[1.05rem] font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>Visit us</h3>

              <div className="flex gap-3.5 border-b border-indigo-line py-3.5 last:border-b-0">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-indigo-line bg-indigo-950 text-gold-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div>
                  <strong className="mb-0.5 block text-[0.9rem] text-cream-050">Address</strong>
                  <span className="text-[0.85rem] text-cream-300">Ndia Kuu Street, Old Town, Mombasa</span>
                </div>
              </div>

              <div className="flex gap-3.5 border-b border-indigo-line py-3.5 last:border-b-0">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-indigo-line bg-indigo-950 text-gold-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 5h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 7a2 2 0 0 1 0-2Z"/></svg>
                </div>
                <div>
                  <strong className="mb-0.5 block text-[0.9rem] text-cream-050">Phone</strong>
                  <span className="text-[0.85rem] text-cream-300">+254 700 123 456</span>
                </div>
              </div>

              <div className="flex gap-3.5 border-b border-indigo-line py-3.5 last:border-b-0">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-indigo-line bg-indigo-950 text-gold-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                </div>
                <div>
                  <strong className="mb-0.5 block text-[0.9rem] text-cream-050">Email</strong>
                  <span className="text-[0.85rem] text-cream-300">karibu@bahari-tamu.co.ke</span>
                </div>
              </div>

              <div className="flex gap-3.5 border-b border-indigo-line py-3.5 last:border-b-0">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-indigo-line bg-indigo-950 text-gold-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                </div>
                <div>
                  <strong className="mb-0.5 block text-[0.9rem] text-cream-050">Hours</strong>
                  <span className="text-[0.85rem] text-cream-300">Mon – Sun, 11:00 – 23:00</span>
                </div>
              </div>
            </div>

            {/* Follow along card */}
            <div className="rounded-lg border border-indigo-line bg-indigo-800 p-[34px]">
              <h3 className="mb-2 text-[1.05rem] font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>Follow along</h3>
              <p className="mb-4 text-[0.87rem] text-cream-300">New dishes and coastal stories, posted daily.</p>
              <div className="flex gap-2.5">
                <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-line text-cream-300 transition-colors hover:border-gold-400 hover:text-gold-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
                </a>
                <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-line text-cream-300 transition-colors hover:border-gold-400 hover:text-gold-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h3l1-3h-4V9c0-.6.4-1 1-1Z"/></svg>
                </a>
                <a href="#" aria-label="X" className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-line text-cream-300 transition-colors hover:border-gold-400 hover:text-gold-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4l16 16M20 4 4 20"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right column: map + form */}
          <div>
            {/* Map */}
            <div className="relative mb-[34px] overflow-hidden rounded-lg border border-indigo-line" style={{ aspectRatio: "16/8" }}>
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80"
                alt="Map area near Mombasa Old Town"
                className="h-full w-full object-cover"
                style={{ filter: "saturate(0.5) brightness(0.75)" }}
              />
              {/* Map pin */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" style={{ transform: "translate(-50%, -100%) rotate(45deg)" }}>
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[50%_50%_50%_0] bg-rust-600 shadow-[0_20px_45px_-25px_rgba(15,22,38,0.55)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" style={{ transform: "rotate(-45deg)" }}><circle cx="12" cy="12" r="5"/></svg>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <ContactForm />
          </div>

        </div>
      </section>
    </div>
  );
}
