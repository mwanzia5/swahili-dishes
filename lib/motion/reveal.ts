import { gsap, ScrollTrigger, reduceMotion } from "./index";

const revealPresets: Record<string, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
  "fade-up": { from: { y: 32, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 } },
  "blur-in": { from: { y: 18, autoAlpha: 0, filter: "blur(10px)" }, to: { y: 0, autoAlpha: 1, filter: "blur(0px)" } },
  "scale": { from: { scale: 0.96, autoAlpha: 0 }, to: { scale: 1, autoAlpha: 1 } },
  "slide-left": { from: { x: 48, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
  "slide-right": { from: { x: -48, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
};

export function initScrollReveals() {
  if (reduceMotion) {
    gsap.set("[data-reveal], [data-reveal-item]", { autoAlpha: 1, clearProps: "all" });
    return;
  }

  gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
    const items = group.querySelectorAll("[data-reveal-item]");
    gsap.set(group, { autoAlpha: 1 });
    gsap.fromTo(
      items,
      { y: 36, autoAlpha: 0, filter: "blur(8px)" },
      {
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.95,
        ease: "power4.out",
        stagger: 0.075,
        scrollTrigger: {
          trigger: group,
          start: "top 82%",
          once: true,
        },
      }
    );
  });

  gsap.utils.toArray<HTMLElement>("[data-reveal]:not([data-reveal-item])").forEach((element) => {
    const preset = revealPresets[element.dataset.reveal || "fade-up"] || revealPresets["fade-up"];
    if (!preset) return;
    
    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(element, preset.from, {
      ...preset.to,
      duration: 0.9,
      ease: "power4.out",
      delay: Number(element.dataset.revealDelay || 0),
      scrollTrigger: {
        trigger: element,
        start: "top 84%",
        once: true,
      },
    });
  });
}

export function initImageReveals() {
  if (reduceMotion) {
    gsap.set("[data-image-reveal]", { autoAlpha: 1, clipPath: "none" });
    return;
  }

  gsap.utils.toArray<HTMLElement>("[data-image-reveal]").forEach((figure) => {
    const image = figure.querySelector("img");
    gsap.set(figure, { autoAlpha: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: figure,
        start: "top 82%",
        once: true,
      },
    });

    tl.fromTo(
      figure,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.out" }
    ).fromTo(
      image,
      { scale: 1.08, autoAlpha: 0.75 },
      { scale: 1, autoAlpha: 1, duration: 1.2, ease: "power4.out" },
      0
    );
  });
}

export function initParallax() {
  if (reduceMotion) return;

  gsap.utils.toArray<HTMLElement>("[data-parallax-image], [data-parallax-layer]").forEach((layer) => {
    const speed = Number(layer.dataset.parallaxSpeed || 0.18);
    const section = layer.closest<HTMLElement>("[data-parallax-section]") || layer;

    gsap.to(layer, {
      y: () => window.innerHeight * speed * -1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });
  });
}

export function initHorizontalGalleries() {
  if (reduceMotion) return;

  gsap.utils.toArray<HTMLElement>("[data-horizontal-gallery]").forEach((section) => {
    const track = section.querySelector<HTMLElement>("[data-horizontal-track]");
    if (!track) return;

    gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${track.scrollWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  });
}