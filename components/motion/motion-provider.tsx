"use client";

import { useEffect } from "react";
import { initMotion, destroyMotion } from "lib/motion";
import { initTextReveals } from "lib/motion/text";
import { initScrollReveals, initImageReveals, initParallax, initHorizontalGalleries } from "lib/motion/reveal";
import { initMagnetic, initCursor, initMouseParallax } from "lib/motion/hover";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initMotion();
    initTextReveals();
    initScrollReveals();
    initImageReveals();
    initParallax();
    initHorizontalGalleries();
    initMagnetic();
    initCursor();
    initMouseParallax();

    return () => {
      destroyMotion();
    };
  }, []);

  return <>{children}</>;
}