import { gsap, ScrollTrigger, reduceMotion } from "./index";

export function initTextReveals() {
  if (reduceMotion) {
    gsap.set("[data-motion-text]", { autoAlpha: 1, clearProps: "all" });
    return;
  }

  document.documentElement.classList.add("has-motion");

  gsap.utils.toArray<HTMLElement>("[data-motion-text='words']").forEach((element) => {
    if (element.dataset.motionSplit === "true") return;
    splitWords(element);
    const words = element.querySelectorAll(".motion-word");

    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      words,
      { yPercent: 110, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.055,
        scrollTrigger: {
          trigger: element,
          start: "top 82%",
          once: true,
        },
      }
    );
  });

  gsap.utils.toArray<HTMLElement>("[data-motion-text='lines']").forEach((element) => {
    if (element.dataset.motionLineSplit === "true") return;
    if (element.querySelector(".motion-line")) return;

    const text = (element.textContent || "").trim();
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      gsap.set(element, { autoAlpha: 1 });
      return;
    }

    element.textContent = "";
    element.setAttribute("aria-label", text);

    lines.forEach((line) => {
      const mask = document.createElement("span");
      const inner = document.createElement("span");

      mask.className = "motion-line-mask";
      mask.setAttribute("aria-hidden", "true");
      inner.className = "motion-line";
      inner.textContent = line;

      mask.appendChild(inner);
      element.appendChild(mask);
      element.appendChild(document.createTextNode(" "));
    });

    element.dataset.motionLineSplit = "true";

    const motionLines = element.querySelectorAll(".motion-line");
    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      motionLines,
      { yPercent: 100, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "power4.out",
        stagger: 0.11,
        scrollTrigger: {
          trigger: element,
          start: "top 84%",
          once: true,
        },
      }
    );
  });
}

function splitWords(element: HTMLElement) {
  if (element.dataset.motionSplit === "true") return;

  const text = element.textContent || "";
  const parts = text.split(/(\s+)/);

  element.textContent = "";
  element.setAttribute("aria-label", text.trim());

  let index = 0;
  parts.forEach((part) => {
    if (!part.trim()) {
      element.appendChild(document.createTextNode(part));
      return;
    }

    const mask = document.createElement("span");
    const word = document.createElement("span");

    mask.className = "motion-word-mask";
    mask.setAttribute("aria-hidden", "true");
    word.className = "motion-word";
    word.textContent = part;
    word.style.setProperty("--word-index", String(index));

    mask.appendChild(word);
    element.appendChild(mask);
    index += 1;
  });

  element.dataset.motionSplit = "true";
}