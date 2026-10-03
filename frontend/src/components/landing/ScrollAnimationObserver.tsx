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
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "50px 0px 50px 0px",
      }
    );

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      // If already in initial viewport, reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        el.classList.add("revealed");
      }
      observer.observe(el);
    });

    // Safety fallback: ensure nothing stays hidden
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll(selector).forEach((el) => el.classList.add("revealed"));
    }, 1200);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  return null;
}
