import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { trackEvent } from "../lib/analytics";
import { D } from "../Root";

const VISIBILITY_SCROLL_THRESHOLD = 520;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const syncVisibility = () => {
      setIsVisible(window.scrollY > VISIBILITY_SCROLL_THRESHOLD);
    };

    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });
    return () => window.removeEventListener("scroll", syncVisibility);
  }, []);

  const handleClick = () => {
    trackEvent("back_to_top_click", {
      page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.button
          type="button"
          onClick={handleClick}
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.94 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-5 bottom-24 md:bottom-8 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 active:scale-95"
          style={{
            background: D.ink,
            color: "#fff",
            border: `1px solid ${D.borderStrong}`,
            boxShadow: `0 14px 30px rgba(15,23,42,0.18)`,
          }}
          aria-label="Επιστροφή στην κορυφή"
        >
          <ArrowUp size={18} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
