"use client";

import { useEffect, useMemo, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";

const slides = [
  {
    id: 1,
    name: "Pilau ya Nyumbani, slow-spiced the Mombasa way",
    description: "Basmati simmered in cloves, cardamom and cinnamon, layered with tender beef and caramelised onion — the pilau our grandmothers still argue over the recipe for.",
    price: "KSh 850",
    priceDetail: "serves one, add nyama choma for KSh 300",
    image: "/images/dishes/pilau.webp",
    eyebrow: "Dish of the week",
    badge: "Today only",
  },
  {
    id: 2,
    name: "Nyama Choma, charcoal-grilled to perfection",
    description: "Every skewer is marinated for six hours in garlic, ginger and coastal spice before it meets the coals. The dish that put us on the map.",
    price: "KSh 1,100",
    priceDetail: "with kachumbari and ugali",
    image: "/images/dishes/nyama-choma.webp",
    eyebrow: "Signature grill",
    badge: "Best seller",
  },
  {
    id: 3,
    name: "Mchuzi wa Samaki, reef fish in coconut curry",
    description: "Fresh reef fish simmered in coconut cream with tamarind, curry leaf and a whisper of coastal chili. Lamu on a plate.",
    price: "KSh 950",
    priceDetail: "serves one, with wali wa nazi",
    image: "/images/dishes/samaki-wa-kupaka.webp",
    eyebrow: "Coastal classic",
    badge: "Popular",
  },
  {
    id: 4,
    name: "Swahili Biryani, fragrant and layered",
    description: "Fragrant rice layered with spiced meat, saffron, and caramelised onions — slow-cooked the Zanzibar way.",
    price: "KSh 1,400",
    priceDetail: "serves two, with raita",
    image: "/images/dishes/biryani.webp",
    eyebrow: "Chef's pick",
    badge: "New",
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Generate stable fire-particle values only on the client to avoid hydration mismatch
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, () => ({
        left: Math.random() * 100,
        top: 50 + Math.random() * 30,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
      })),
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setCurrent((prev) => (prev + 1) % slides.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const currentSlide = slides[current];

  useEffect(() => {
    if (!currentSlide) return;

    setIsAnimating(true);
    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    });

    tl.fromTo(
      ".hero-copy",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
      .fromTo(
        ".hero-visual",
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 1, ease: "power3.out" },
        "-=0.6"
      )
      .fromTo(
        ".hero-badge-anim",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      );

    return () => { tl.kill(); };
  }, [current, currentSlide]);

  const goTo = (index: number) => {
    if (!isAnimating) setCurrent(index);
  };

  const goNext = () => goTo((current + 1) % slides.length);
  const goPrev = () => goTo((current - 1 + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden py-[70px] lg:py-[90px]" style={{ background: "var(--color-indigo-950)" }}>
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 20%, rgba(226,161,58,.10), transparent 45%), radial-gradient(ellipse at 85% 80%, rgba(177,80,47,.14), transparent 50%)" }} />

      {/* Floating accents */}
      <div className="animate-float absolute left-10 top-20" data-mouse-depth="0.03" data-mouse-parallax>
        <div className="h-16 w-16 rounded-full bg-gold-400/20 blur-xl" />
      </div>
      <div className="animate-float-delayed absolute bottom-40 right-20" data-mouse-depth="0.05" data-mouse-parallax>
        <div className="h-24 w-24 rounded-full bg-rust-600/15 blur-2xl" />
      </div>

      {/* Fire particles */}
      {mounted && (
        <div className="pointer-events-none absolute inset-0">
          {particles.map((p, i) => (
            <div
              key={i}
              className="fire-particle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-14 px-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Left copy */}
        <div className="hero-copy">
          <span className="mb-[18px] inline-flex items-center gap-2.5 text-[0.82rem] font-semibold text-gold-400">
            <span className="inline-block h-px w-[26px] bg-gold-400" />
            {currentSlide?.eyebrow}
          </span>

          <h1
            className="mb-6 text-[clamp(2.4rem,4.2vw,3.8rem)] font-medium leading-[1.12] tracking-[-0.01em] text-cream-050"
            data-motion-text="words"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {currentSlide?.name}
          </h1>

          <p className="mb-6 max-w-[62ch] text-[1.05rem] leading-relaxed text-cream-300">
            {currentSlide?.description}
          </p>

          <div className="mb-[22px] inline-flex items-baseline gap-1.5" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-[1.6rem] text-gold-100">{currentSlide?.price}</span>
            <small className="text-[0.75rem] font-medium text-cream-300" style={{ fontFamily: "var(--font-body)" }}>/ {currentSlide?.priceDetail}</small>
          </div>

          <div className="mb-[34px] flex flex-wrap gap-4">
            <Link
              href="/menu"
              className="btn btn-primary"
              data-magnetic="0.15"
            >
              Order this dish
            </Link>
            <Link
              href="/menu"
              className="btn btn-outline"
              data-magnetic="0.15"
            >
              View full menu
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8">
            <div>
              <strong className="block text-[1.5rem]" style={{ fontFamily: "var(--font-display)", color: "var(--color-cream-050)" }}>14</strong>
              <span className="text-[0.78rem] text-cream-300">years on the coast</span>
            </div>
            <div>
              <strong className="block text-[1.5rem]" style={{ fontFamily: "var(--font-display)", color: "var(--color-cream-050)" }}>36</strong>
              <span className="text-[0.78rem] text-cream-300">coastal recipes</span>
            </div>
            <div>
              <strong className="block text-[1.5rem]" style={{ fontFamily: "var(--font-display)", color: "var(--color-cream-050)" }}>4.9</strong>
              <span className="text-[0.78rem] text-cream-300">average rating</span>
            </div>
          </div>

          {/* Slide navigation */}
          <div className="mt-10 flex items-center gap-6">
            <button
              onClick={goPrev}
              className="rounded-[3px] border border-indigo-line bg-transparent p-2.5 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="hero-slide-counter font-mono text-cream-100">
              <span className="current">{String(current + 1).padStart(2, "0")}</span>
              <span className="mx-2 text-neutral-600">/</span>
              <span className="total">{String(slides.length).padStart(2, "0")}</span>
            </div>
            <button
              onClick={goNext}
              className="rounded-[3px] border border-indigo-line bg-transparent p-2.5 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-8 bg-gold-400" : "w-2 bg-neutral-600"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right visual — arch frame */}
        <div className="hero-visual relative">
          <div className="arch-frame">
            <img
              src={currentSlide?.image}
              alt={currentSlide?.name}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Price badge */}
          <div className="hero-badge-anim absolute -left-[22px] -bottom-[22px] rounded-[3px] bg-rust-600 px-[22px] py-4 text-[1.3rem] text-cream-050 shadow-[0_20px_45px_-25px_rgba(15,22,38,0.55)]" style={{ fontFamily: "var(--font-display)" }}>
            {currentSlide?.price}
            <span className="mt-0.5 block text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-cream-100 opacity-85" style={{ fontFamily: "var(--font-body)" }}>{currentSlide?.badge}</span>
          </div>
          {/* Spice token */}
          <div className="hero-badge-anim absolute right-[-8%] top-[10%] h-[108px] w-[108px] overflow-hidden rounded-full border-4 border-indigo-950 shadow-[0_20px_45px_-25px_rgba(15,22,38,0.55)]">
            <img
              src="/images/dishes/spices.webp"
              alt="Whole cloves and cinnamon sticks"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="h-8 w-5 rounded-full border-2 border-neutral-600">
          <div className="mx-auto mt-2 h-2 w-1 rounded-full bg-neutral-400" />
        </div>
      </div>
    </section>
  );
}
