import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power3.out", duration: 0.85 });

const reduceMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : true;

let lenis: Lenis | null = null;

export function initMotion() {
  if (reduceMotion || lenis) return;

  lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    anchors: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis!.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });

  document.documentElement.classList.add("has-motion");
}

export function destroyMotion() {
  lenis?.destroy();
  lenis = null;
  document.documentElement.classList.remove("has-motion");
}

export { gsap, ScrollTrigger, reduceMotion };