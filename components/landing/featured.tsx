"use client";

import Link from "next/link";

export function FeaturedSection() {
  return (
    <section className="relative overflow-hidden py-24" style={{ background: "var(--color-indigo-950)" }} data-mouse-parallax>
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px] px-8">
        <div className="grid items-center gap-[60px] lg:grid-cols-2" data-reveal="slide-right">
          {/* Left content */}
          <div>
            <span className="mb-4 inline-block text-[0.85rem] font-semibold text-gold-400">Signature grill</span>
            <h2
              className="mb-6 text-[clamp(1.9rem,3vw,2.6rem)]"
              data-motion-text="words"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Our Nyama Choma is grilled to order over coconut husk charcoal
            </h2>
            <p className="mb-8 max-w-[62ch] text-[1.05rem] leading-relaxed text-cream-300">
              Every skewer is marinated for six hours in garlic, ginger and coastal spice before it meets the coals. It&apos;s the dish that put us on the map.
            </p>

            {/* Feature items */}
            <div className="mt-[26px] flex flex-wrap gap-7">
              <div className="flex max-w-[220px] items-start gap-3.5" data-reveal="fade-up" data-reveal-delay="0.1">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-indigo-line bg-indigo-800 text-gold-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 12c2-4 4-6 8-6s6 2 8 6-4 8-8 8-10-4-8-8Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-[0.92rem] font-bold text-cream-050" style={{ fontFamily: "var(--font-body)" }}>Fresh spices, daily</h4>
                  <p className="text-[0.82rem] text-cream-300">Ground each morning at the market, never pre-mixed.</p>
                </div>
              </div>
              <div className="flex max-w-[220px] items-start gap-3.5" data-reveal="fade-up" data-reveal-delay="0.2">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-indigo-line bg-indigo-800 text-gold-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 20 12 4l8 16H4Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-[0.92rem] font-bold text-cream-050" style={{ fontFamily: "var(--font-body)" }}>Charcoal-grilled</h4>
                  <p className="text-[0.82rem] text-cream-300">Cooked low and slow over coconut husk embers.</p>
                </div>
              </div>
            </div>

            <Link href="/menu" className="btn btn-rust mt-7" data-magnetic="0.12">
              Order Nyama Choma
            </Link>
          </div>

          {/* Right image — arch frame */}
          <div className="relative" data-reveal="scale" data-parallax-section>
            <div className="arch-frame" style={{ aspectRatio: "5/4", borderRadius: "18px 220px 18px 18px" }}>
              <img
                src="/images/dishes/nyama-choma.webp"
                alt="Charcoal grill with skewers of meat"
                className="h-full w-full object-cover"
                data-parallax-image
                data-parallax-speed="0.12"
              />
            </div>

            {/* Floating rating badge */}
            <div className="absolute -right-8 -top-8 z-20 rounded-2xl bg-rust-600 p-6 shadow-2xl" data-mouse-depth="0.06" data-mouse-parallax>
              <div className="text-3xl font-bold text-white">4.9</div>
              <div className="text-sm text-white/80">Rating</div>
              <div className="mt-1 flex text-gold-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center" data-reveal="fade-up">
          <Link
            href="/recipes"
            className="btn btn-primary px-10 py-5 text-lg"
            data-magnetic="0.12"
          >
            Explore Our Recipes
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
