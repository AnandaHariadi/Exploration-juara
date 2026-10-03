"use client";

import { useEffect } from "react";

export function ScrollAnimationObserver() {
  useEffect(() => {
    const selector = ".reveal-on-scroll, .reveal-3d, .reveal-scale, .reveal-left, .reveal-right";

    const updateVisibility = () => {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      const windowHeight = window.innerHeight;
      const revealThreshold = windowHeight * 0.92; // 92% of screen height

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Element is visible within active viewport window
        if (rect.top < revealThreshold && rect.bottom > 40) {
          el.classList.add("revealed");
        } else if (rect.top > windowHeight + 20 || rect.bottom < -40) {
          // Element has scrolled completely out of view (above or below)
          el.classList.remove("revealed");
        }
      });
    };

    // Run on initial mount
    updateVisibility();

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return null;
}


