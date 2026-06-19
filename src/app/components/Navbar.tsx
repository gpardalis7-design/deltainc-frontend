import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowRight } from "lucide-react";
import { D } from "../Root";
import { useNavigation } from "../lib/navigationContext";
import { trackCtaClick, trackNavClick } from "../lib/analytics";
import { Logo } from "./Logo";

// Fixed navigation items
const NAV_ITEMS = [
  { label: "Αρχική", url: "/" },
  { label: "Μεταπτυχιακά", url: "/metaptyxiaka" },
  { label: "ΑΣΕΠ", url: "/asep" },
  { label: "ΟΠΣΥΔ", url: "/opsyd" },
  { label: "Delta Apps", url: "/delta-apps", isNew: true },
  { label: "Blog", url: "/blog" },
  { label: "Επικοινωνία", url: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { mode, cta, openModal } = useNavigation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isNavActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const hasCTA = Boolean(cta.text && (cta.link || cta.formType || cta.action));

  // CTA visibility logic
  // Service mode: always show CTA
  // Content mode: show CTA only when scrolled (or always on desktop but subtle)
  const showCTA = hasCTA && (mode === "service" || scrolled);

  // Handle CTA click - support formType modal or navigation
  const handleCtaClick = (e: React.MouseEvent) => {
    trackCtaClick(cta.text || "navbar_cta", "navbar", {
      cta_target: cta.link || cta.formType || "custom_action",
    });

    if (cta.action) {
      e.preventDefault();
      cta.action();
      return;
    }

    // If formType is set, open modal instead of navigating
    if (cta.formType) {
      e.preventDefault();
      openModal();
      return;
    }
    
    // If already on contact page, smooth scroll to form
    if (cta.link === "/contact" && location.pathname === "/contact") {
      e.preventDefault();
      const formSection = document.getElementById("contact-form");
      formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-3"
      >
        <div
          className="max-w-6xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300"
          style={{
            background: scrolled ? D.headerGlass : "rgba(248,250,255,0.88)",
            backdropFilter: "blur(20px)",
            border: scrolled ? `1px solid ${D.border}` : "1px solid rgba(148,163,184,0.22)",
            boxShadow: scrolled ? `0 4px 24px ${D.shadow}` : "0 1px 0 rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.06)",
            borderRadius: D.radiusShell,
          }}
        >
          {/* Logo */}
          <div onClick={() => trackNavClick("Logo", "navbar_logo", { nav_target: "/" })}>
            <Logo className="shrink-0" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.url);
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className="px-4 py-2 rounded-xl text-sm transition-all duration-200"
                  style={{
                    color: active ? D.ink : D.inkSoft,
                    background: active ? (scrolled ? D.accentSoft : "rgba(29,78,216,0.08)") : "transparent",
                    fontWeight: active ? 600 : 400,
                    border: active ? (scrolled ? `1px solid rgba(197,141,42,0.25)` : "1px solid rgba(29,78,216,0.14)") : "1px solid transparent",
                    borderRadius: D.radiusControl,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = D.ink;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = D.inkSoft;
                  }}
                  onClick={() =>
                    trackNavClick(item.label, "navbar_desktop", {
                      nav_target: item.url,
                    })
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {item.isNew ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.08em] uppercase"
                        style={{
                          background: active ? "rgba(15,23,42,0.08)" : D.accentSoft,
                          color: active ? D.ink : D.accentStrong,
                          fontWeight: 700,
                        }}
                      >
                        Νέο
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* CTA + Mobile */}
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {showCTA && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {cta.formType || cta.action ? (
                    <button
                      type="button"
                      onClick={handleCtaClick}
                      className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 shrink-0"
                      style={{
                        background: mode === "service" ? D.ink : D.accentStrong,
                        color: "#fff",
                        fontWeight: 600,
                        boxShadow: `0 2px 12px ${D.shadow}`,
                        borderRadius: D.radiusControl,
                      }}
                    >
                      {cta.text}
                      {mode === "service" && <ArrowRight size={14} />}
                    </button>
                  ) : (
                    <Link
                      to={cta.link || "/"}
                      onClick={handleCtaClick}
                      className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 shrink-0"
                      style={{
                        background: mode === "service" ? D.ink : D.accentStrong,
                        color: "#fff",
                        fontWeight: 600,
                        boxShadow: `0 2px 12px ${D.shadow}`,
                        borderRadius: D.radiusControl,
                      }}
                    >
                      {cta.text}
                      {mode === "service" && <ArrowRight size={14} />}
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: D.accentSoft, color: D.ink, border: `1px solid rgba(197,141,42,0.2)`, borderRadius: D.radiusControl }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-40 rounded-2xl p-3 flex flex-col gap-1"
            style={{
              background: D.surfaceStrong,
              border: `1px solid ${D.border}`,
              boxShadow: `0 8px 32px ${D.shadow}`,
              borderRadius: D.radiusCard,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.url);
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    color: active ? D.ink : D.inkSoft,
                    background: active ? D.accentSoft : "transparent",
                    fontWeight: active ? 600 : 400,
                    borderRadius: D.radiusControl,
                  }}
                  onClick={() =>
                    trackNavClick(item.label, "navbar_mobile", {
                      nav_target: item.url,
                    })
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {item.isNew ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.08em] uppercase"
                        style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}
                      >
                        Νέο
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
            {hasCTA && (
              cta.formType || cta.action ? (
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="mt-1 px-4 py-3 rounded-xl text-sm text-white text-center flex items-center justify-center gap-1.5"
                  style={{ background: D.ink, fontWeight: 600, borderRadius: D.radiusControl }}
                >
                  {cta.text}
                  <ArrowRight size={14} />
                </button>
              ) : (
                <Link
                  to={cta.link || "/"}
                  onClick={handleCtaClick}
                  className="mt-1 px-4 py-3 rounded-xl text-sm text-white text-center flex items-center justify-center gap-1.5"
                  style={{ background: D.ink, fontWeight: 600 }}
                >
                  {cta.text}
                  <ArrowRight size={14} />
                </Link>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
