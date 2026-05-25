import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { ArrowRight, Mail, X } from "lucide-react";
import { D } from "../Root";
import { useNavigation as useSiteNavigation } from "../lib/navigationContext";
import { getDeviceType, trackEvent } from "../lib/analytics";
import {
  getOverlayVisibility,
  OVERLAY_VISIBILITY_CHANGED_EVENT,
  setOverlayVisibility,
} from "../lib/uiOverlayState";

const NEWSLETTER_SUBSCRIBE_URL = "https://deltainc.gr/wp-admin/admin-ajax.php?action=tnp&na=sa";
const SESSION_SHOWN_KEY = "newsletter_popup_shown_session";
const DISMISSED_AT_KEY = "newsletter_popup_dismissed_at";
const OPEN_EVENT_NAME = "delta:open-newsletter";
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 14_000;
const SHOW_SCROLL_RATIO = 0.4;
const RESERVED_TOP_LEVEL_ROUTES = new Set(["blog", "contact", "courses", "about"]);
type NewsletterTriggerType = "timer" | "scroll" | "manual";

function isEligiblePath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (/^\/blog\/[^/]+$/.test(pathname)) return true;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return false;

  return !RESERVED_TOP_LEVEL_ROUTES.has(segments[0]);
}

function hasDismissCooldown(): boolean {
  if (typeof window === "undefined") return false;

  const dismissedAt = window.localStorage.getItem(DISMISSED_AT_KEY);
  if (!dismissedAt) return false;

  const timestamp = Number(dismissedAt);
  if (!Number.isFinite(timestamp)) return false;

  return Date.now() - timestamp < DISMISS_COOLDOWN_MS;
}

function hasShownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_SHOWN_KEY) === "true";
}

function markShownThisSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_SHOWN_KEY, "true");
}

function markDismissed() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
}

function getScrollProgress(): number {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 1;
  return window.scrollY / scrollHeight;
}

export function NewsletterSlideIn() {
  const location = useLocation();
  const { isModalOpen, showStickyBottom } = useSiteNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openedManually, setOpenedManually] = useState(false);
  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState(false);
  const [pendingTriggerType, setPendingTriggerType] = useState<NewsletterTriggerType | null>(null);

  const isEligible = useMemo(() => isEligiblePath(location.pathname), [location.pathname]);
  const mobileBottomOffset = showStickyBottom ? 92 : 16;

  const trackPopupEvent = (
    eventName: string,
    extra: Record<string, string | number | boolean | undefined> = {},
  ) => {
    trackEvent(eventName, {
      page_path: location.pathname,
      device_type: getDeviceType(),
      ...extra,
    });
  };

  useEffect(() => {
    setOverlayVisibility("newsletter", isVisible);
    return () => setOverlayVisibility("newsletter", false);
  }, [isVisible]);

  useEffect(() => {
    setIsCookieBannerOpen(getOverlayVisibility("cookie-consent"));

    const handleOverlayChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ name: string; isVisible: boolean }>;
      if (customEvent.detail?.name !== "cookie-consent") return;

      const nextVisible = Boolean(customEvent.detail.isVisible);
      setIsCookieBannerOpen(nextVisible);

      if (nextVisible && isVisible) {
        setIsVisible(false);
        setOpenedManually(false);
      }

      if (!nextVisible && pendingTriggerType && !isVisible && !isModalOpen && isEligible) {
        if (hasShownThisSession() || hasDismissCooldown()) {
          setPendingTriggerType(null);
          return;
        }

        markShownThisSession();
        setOpenedManually(pendingTriggerType === "manual");
        setIsVisible(true);
        setError("");
        setIsSuccess(false);
        trackPopupEvent("newsletter_popup_shown", { trigger_type: pendingTriggerType });
        setPendingTriggerType(null);
      }
    };

    window.addEventListener(OVERLAY_VISIBILITY_CHANGED_EVENT, handleOverlayChange);
    return () => window.removeEventListener(OVERLAY_VISIBILITY_CHANGED_EVENT, handleOverlayChange);
  }, [isEligible, isModalOpen, isVisible, pendingTriggerType, location.pathname]);

  useEffect(() => {
    const handleOpenNewsletter = () => {
      if (getOverlayVisibility("cookie-consent")) {
        setPendingTriggerType("manual");
        return;
      }

      markShownThisSession();
      setOpenedManually(true);
      setIsVisible(true);
      setError("");
      setIsSuccess(false);
      trackPopupEvent("newsletter_popup_shown", { trigger_type: "manual" });
    };

    window.addEventListener(OPEN_EVENT_NAME, handleOpenNewsletter);

    return () => {
      window.removeEventListener(OPEN_EVENT_NAME, handleOpenNewsletter);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!isEligible || isModalOpen) {
      setIsVisible(false);
      setPendingTriggerType(null);
      if (isModalOpen) {
        setOpenedManually(false);
      }
      return;
    }

    if (hasShownThisSession() || hasDismissCooldown()) {
      return;
    }

    let cancelled = false;

    const showPopup = (triggerType: NewsletterTriggerType) => {
      if (cancelled || hasShownThisSession() || hasDismissCooldown()) return;
      if (getOverlayVisibility("cookie-consent")) {
        setPendingTriggerType(triggerType);
        return;
      }

      markShownThisSession();
      setOpenedManually(triggerType === "manual");
      setIsVisible(true);
      setError("");
      setIsSuccess(false);
      trackPopupEvent("newsletter_popup_shown", { trigger_type: triggerType });
    };

    const timer = window.setTimeout(() => showPopup("timer"), SHOW_DELAY_MS);

    const handleScroll = () => {
      if (getScrollProgress() >= SHOW_SCROLL_RATIO) {
        window.clearTimeout(timer);
        window.removeEventListener("scroll", handleScroll);
        showPopup("scroll");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isEligible, isModalOpen, location.key, isCookieBannerOpen]);

  useEffect(() => {
    if (isModalOpen) {
      setIsVisible(false);
      setOpenedManually(false);
    }
  }, [isModalOpen]);

  if ((!isEligible && !openedManually) || !isVisible) return null;

  const dismiss = (method: "x" | "later") => {
    markDismissed();
    setIsVisible(false);
    setOpenedManually(false);
    setError("");
    setIsSuccess(false);
    trackPopupEvent(
      method === "x" ? "newsletter_popup_dismiss_x" : "newsletter_popup_dismiss_later",
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      setError("Συμπληρώστε ένα έγκυρο email για να συνεχίσετε.");
      trackPopupEvent("newsletter_popup_submit_failed", { error_type: "invalid_email" });
      return;
    }

    setError("");
    setIsSubmitting(true);
    trackPopupEvent("newsletter_popup_submit_started");

    const formData = new FormData();
    formData.set("ne", normalizedEmail);
    formData.set("nlang", "");
    formData.set("np1", window.location.pathname);
    formData.set("np2", window.location.href);

    try {
      await fetch(NEWSLETTER_SUBSCRIBE_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail("");
      trackPopupEvent("newsletter_popup_submit_succeeded");
      markDismissed();

      window.setTimeout(() => {
        setIsVisible(false);
        setOpenedManually(false);
        setIsSuccess(false);
      }, 2200);
    } catch {
      setIsSubmitting(false);
      setError("Η εγγραφή απέτυχε. Παρακαλώ δοκιμάστε ξανά σε λίγο.");
      trackPopupEvent("newsletter_popup_submit_failed", { error_type: "network_error" });
    }
  };

  return (
    <div
      className="fixed z-[70] pointer-events-none inset-x-0 bottom-0 px-4 sm:px-6"
      style={{ paddingBottom: `max(env(safe-area-inset-bottom), ${mobileBottomOffset}px)` }}
      aria-live="polite"
    >
      <div className="mx-auto max-w-6xl flex justify-end">
        <section
          className="pointer-events-auto w-full sm:max-w-[25rem] rounded-[1.75rem] p-5 sm:p-6 border shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
            borderColor: "rgba(37,99,235,0.16)",
            color: D.ink,
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[0.68rem] uppercase tracking-[0.14em] mb-3"
                style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}
              >
                <Mail size={12} />
                Newsletter
              </div>
              <h2 className="type-display-card text-[1.05rem] leading-[1.25] mb-2" style={{ color: D.ink }}>
                Μείνετε μπροστά στις σημαντικές εξελίξεις.
              </h2>
              <p className="text-sm leading-6" style={{ color: D.inkSoft }}>
                Λάβετε ενημερώσεις για προκηρύξεις, πίνακες, μεταπτυχιακά και χρήσιμους οδηγούς.
              </p>
            </div>

            <button
              type="button"
              onClick={() => dismiss("x")}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(15,23,42,0.04)", color: D.inkSoft }}
              aria-label="Κλείσιμο newsletter signup"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                placeholder="Το email σας"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-shadow"
                style={{
                  background: D.surface,
                  border: `1px solid ${error ? "rgba(220,38,38,0.3)" : D.border}`,
                  color: D.ink,
                  boxShadow: error ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
                }}
                autoComplete="email"
                disabled={isSubmitting || isSuccess}
              />
            </label>

            {error ? (
              <p className="text-xs" style={{ color: "#B91C1C" }}>
                {error}
              </p>
            ) : null}

            {isSuccess ? (
              <p className="text-xs" style={{ color: "#166534" }}>
                Η εγγραφή σας ολοκληρώθηκε επιτυχώς. Θα λαμβάνετε πλέον τις ενημερώσεις μας.
              </p>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm transition-opacity hover:opacity-90"
                style={{ background: D.accent, color: "#fff", fontWeight: 700 }}
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting ? "Εγγραφή..." : isSuccess ? "Ολοκληρώθηκε" : <>Συνέχεια για εγγραφή <ArrowRight size={14} /></>}
              </button>

              <button
                type="button"
                onClick={() => dismiss("later")}
                className="inline-flex items-center justify-center px-4 py-3 rounded-2xl text-sm transition-colors"
                style={{ background: "rgba(15,23,42,0.04)", color: D.inkSoft, fontWeight: 600 }}
                disabled={isSubmitting}
              >
                Ίσως αργότερα
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
