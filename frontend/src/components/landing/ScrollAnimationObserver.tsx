"use client";

import { useEffect } from "react";

export function ScrollAnimationObserver() {
  useEffect(() => {
    const selector = ".reveal-on-scroll, .reveal-3d, .reveal-scale, .reveal-left, .reveal-right";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          } else {
            // When user scrolls past or away, remove revealed so scrolling back triggers smoothly
            const rect = entry.target.getBoundingClientRect();
            // If scrolled above or far below, allow re-trigger
            if (rect.top > window.innerHeight || rect.bottom < -50) {
              entry.target.classList.remove("revealed");
            }
          }
        });
      },
      {
        threshold: [0.08, 0.2],
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      // If currently visible in initial viewport on page load, reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50 && rect.bottom > 0) {
        el.classList.add("revealed");
      }
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

