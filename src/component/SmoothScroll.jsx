"use client";

import { useEffect } from "react";

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;

      const id = target.getAttribute("href");
      const el = document.querySelector(id);

      if (el) {
        e.preventDefault();
        el.scrollIntoView({
          behavior: "smooth",
        });
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return children;
}
