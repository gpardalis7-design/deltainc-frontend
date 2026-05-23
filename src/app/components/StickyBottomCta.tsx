import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigation } from "../lib/navigationContext";
import { trackCtaClick } from "../lib/analytics";
import { D } from "../Root";

export function StickyBottomCta() {
  const { cta, showStickyBottom, openModal } = useNavigation();

  const handleClick = (e: React.MouseEvent) => {
    trackCtaClick(cta.text || "sticky_cta", "sticky_bottom", {
      cta_target: cta.link || cta.formType || "custom_action",
    });

    if (cta.action) {
      e.preventDefault();
      cta.action();
      return;
    }
    if (cta.formType) {
      e.preventDefault();
      openModal();
    }
  };

  return (
    <AnimatePresence>
      {showStickyBottom && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pb-4 pt-2"
          style={{
            background: `linear-gradient(to top, ${D.bg} 60%, transparent)`,
            backdropFilter: "blur(8px)",
          }}
        >
          {cta.formType || cta.action ? (
            <button
              onClick={handleClick}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm transition-all active:scale-95"
              style={{
                background: D.ink,
                color: "#fff",
                fontWeight: 700,
                boxShadow: `0 4px 20px ${D.shadow}`,
                minHeight: "48px", // thumb-friendly
              }}
            >
              {cta.text} <ArrowRight size={16} />
            </button>
          ) : (
            <Link
              to={cta.link}
              onClick={() =>
                trackCtaClick(cta.text || "sticky_cta", "sticky_bottom", {
                  cta_target: cta.link || "link",
                })
              }
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm transition-all active:scale-95"
              style={{
                background: D.ink,
                color: "#fff",
                fontWeight: 700,
                boxShadow: `0 4px 20px ${D.shadow}`,
                minHeight: "48px", // thumb-friendly
              }}
            >
              {cta.text} <ArrowRight size={16} />
            </Link>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
