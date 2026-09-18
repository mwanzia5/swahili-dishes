import { gsap, reduceMotion } from "./index";

export function initMagnetic() {
  if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

  gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((element) => {
    const strength = Number(element.dataset.magnetic || 0.18);
    const xTo = gsap.quickTo(element, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.45, ease: "power3.out" });

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;

      xTo(x);
      yTo(y);
    });

    element.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

export function initCursor() {
  if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

  const cursor = document.querySelector<HTMLElement>("[data-cursor]");
  if (!cursor) return;

  const label = cursor.querySelector<HTMLElement>("[data-cursor-label]");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

  document.addEventListener("pointermove", (event) => {
    xTo(event.clientX);
    yTo(event.clientY);
  });

  gsap.utils.toArray<HTMLElement>("[data-cursor-label]")
    .filter((target) => !cursor.contains(target))
    .forEach((target) => {
      target.addEventListener("pointerenter", () => {
        if (label) label.textContent = target.dataset.cursorLabel || "";
        gsap.to(cursor, { scale: 1.75, duration: 0.35, ease: "power3.out" });
      });

      target.addEventListener("pointerleave", () => {
        if (label) label.textContent = "";
        gsap.to(cursor, { scale: 1, duration: 0.35, ease: "power3.out" });
      });
    });
}

export function initMouseParallax() {
  if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

  gsap.utils.toArray<HTMLElement>("[data-mouse-parallax]").forEach((section) => {
    const layers = section.querySelectorAll<HTMLElement>("[data-mouse-depth]");
    const setters = Array.from(layers).map((layer) => ({
      layer,
      depth: Number(layer.dataset.mouseDepth || 0.04),
      xTo: gsap.quickTo(layer, "x", { duration: 0.8, ease: "power3.out" }),
      yTo: gsap.quickTo(layer, "y", { duration: 0.8, ease: "power3.out" }),
    }));

    section.addEventListener("pointermove", (event) => {
      const rect = section.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      setters.forEach(({ depth, xTo, yTo }) => {
        xTo(x * depth);
        yTo(y * depth);
      });
    });

    section.addEventListener("pointerleave", () => {
      setters.forEach(({ xTo, yTo }) => {
        xTo(0);
        yTo(0);
      });
    });
  });
}