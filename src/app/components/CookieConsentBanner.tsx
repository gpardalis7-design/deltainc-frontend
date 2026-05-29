import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Cookie, Settings2, ShieldCheck } from "lucide-react";
import { D } from "../Root";
import {
  acceptAllCookieConsent,
  COOKIE_SETTINGS_OPEN_EVENT,
  getDefaultCookieConsent,
  getStoredCookieConsent,
  rejectNonEssentialCookieConsent,
  saveCookieConsent,
  type CookieConsent,
} from "../lib/cookieConsent";
import {
  getOverlayVisibility,
  OVERLAY_VISIBILITY_CHANGED_EVENT,
  setOverlayVisibility,
} from "../lib/uiOverlayState";

const AUTO_SHOW_DELAY_MS = 6_000;

function ConsentToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 rounded-2xl p-4"
      style={{
        background: D.surface,
        border: `1px solid ${D.border}`,
      }}
    >
      <div className="min-w-0">
        <div className="text-sm md:text-[0.95rem]" style={{ color: D.ink, fontWeight: 700 }}>
          {label}
        </div>
        <p className="mt-1 text-sm" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        onClick={() => onChange?.(!checked)}
        className="shrink-0 inline-flex h-8 w-14 items-center rounded-full transition-all"
        style={{
          background: checked ? D.accent : "rgba(148,163,184,0.28)",
          opacity: disabled ? 0.8 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: checked ? `0 8px 18px ${D.accentSoft}` : "none",
        }}
      >
        <span
          className="block h-6 w-6 rounded-full transition-transform"
          style={{
            background: "#fff",
            transform: checked ? "translateX(28px)" : "translateX(4px)",
            boxShadow: "0 6px 14px rgba(15,23,42,0.16)",
          }}
        />
      </button>
    </div>
  );
}

export function CookieConsentBanner() {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftConsent, setDraftConsent] = useState<CookieConsent>(getDefaultCookieConsent);
  const [isPendingAutoOpen, setIsPendingAutoOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredCookieConsent();
    if (stored) {
      setDraftConsent(stored);
      setIsVisible(false);
    }

    setIsReady(true);

    if (stored) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (getOverlayVisibility("newsletter")) {
        setIsPendingAutoOpen(true);
        return;
      }

      setIsVisible(true);
    }, AUTO_SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      const stored = getStoredCookieConsent();
      if (stored) setDraftConsent(stored);
      setIsPendingAutoOpen(false);
      setIsExpanded(true);
      setIsVisible(true);
    };

    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    const handleOverlayChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ name: string; isVisible: boolean }>;
      if (customEvent.detail?.name !== "newsletter") return;

      const nextVisible = Boolean(customEvent.detail.isVisible);

      if (!nextVisible && isPendingAutoOpen && !getStoredCookieConsent()) {
        setIsPendingAutoOpen(false);
        setIsVisible(true);
      }
    };

    window.addEventListener(OVERLAY_VISIBILITY_CHANGED_EVENT, handleOverlayChange);
    return () => window.removeEventListener(OVERLAY_VISIBILITY_CHANGED_EVENT, handleOverlayChange);
  }, [isPendingAutoOpen]);

  useEffect(() => {
    setOverlayVisibility("cookie-consent", isVisible);
    return () => setOverlayVisibility("cookie-consent", false);
  }, [isVisible]);

  const statusCopy = useMemo(() => {
    if (draftConsent.analytics || draftConsent.preferences) {
      return "Οι προτιμήσεις σας αποθηκεύονται τοπικά ώστε να μπορείτε να τις τροποποιείτε αργότερα.";
    }

    return "Μπορείτε να κρατήσετε μόνο τα απολύτως απαραίτητα στοιχεία ενεργά και να αλλάξετε γνώμη αργότερα.";
  }, [draftConsent.analytics, draftConsent.preferences]);

  if (!isReady || !isVisible) return null;

  const closeWith = (consent: CookieConsent) => {
    setDraftConsent(consent);
    setIsPendingAutoOpen(false);
    setIsVisible(false);
    setIsExpanded(false);
  };

  const handleAcceptAll = () => {
    const consent = acceptAllCookieConsent();
    closeWith(consent);
  };

  const handleRejectNonEssential = () => {
    const consent = rejectNonEssentialCookieConsent();
    closeWith(consent);
  };

  const handleSaveSelection = () => {
    const consent = saveCookieConsent({
      necessary: true,
      analytics: draftConsent.analytics,
      preferences: draftConsent.preferences,
    });
    closeWith(consent);
  };

  const expandedSheetMaxHeight = "calc(100vh - env(safe-area-inset-top) - 12px)";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 md:px-6 md:pb-6 pointer-events-none">
      <div className="mx-auto max-w-2xl pointer-events-auto md:mx-0 md:mr-auto md:max-w-[27rem]">
        <div
          className="rounded-[1.5rem] p-4 md:p-[1.05rem] flex flex-col"
          style={{
            background: "rgba(255,255,255,0.92)",
            border: `1px solid ${D.border}`,
            boxShadow: "0 14px 34px rgba(15,23,42,0.10)",
            backdropFilter: "blur(18px)",
            maxHeight: isExpanded ? expandedSheetMaxHeight : undefined,
            overflow: isExpanded ? "hidden" : undefined,
          }}
        >
          <div
            className="min-h-0"
            style={{
              overflowY: isExpanded ? "auto" : undefined,
              paddingRight: isExpanded ? "0.125rem" : undefined,
              overscrollBehavior: isExpanded ? "contain" : undefined,
              WebkitOverflowScrolling: isExpanded ? "touch" : undefined,
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em]"
                  style={{ background: "rgba(29,78,216,0.08)", color: D.accentStrong, fontWeight: 800 }}
                >
                  <Cookie size={12} />
                  Cookies
                </div>
                <h2 className="mt-3 text-[1.05rem] md:text-[1.1rem]" style={{ color: D.ink, fontWeight: 800, lineHeight: 1.2 }}>
                  Επιλογές cookies
                </h2>
                <p className="mt-2 text-[0.9rem]" style={{ color: D.inkSoft, lineHeight: 1.62 }}>
                  Η Delta Inc. χρησιμοποιεί cookies και τοπική αποθήκευση για βασική λειτουργία, αναλυτικά δεδομένα και αποθήκευση επιλογών εμπειρίας.
                </p>
                <p className="mt-1.5 text-[0.88rem]" style={{ color: D.inkSoft, lineHeight: 1.58 }}>
                  {statusCopy} Δείτε και την{" "}
                  <Link to="/cookie-policy" className="underline underline-offset-4" style={{ color: D.accentStrong }}>
                    Πολιτική Cookies
                  </Link>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full px-3 py-2 text-[0.84rem] transition-colors"
                style={{
                  color: D.ink,
                  background: "rgba(248,250,252,0.92)",
                    border: `1px solid ${D.border}`,
                    fontWeight: 700,
                  }}
              >
                <Settings2 size={15} />
                {isExpanded ? "Κλείσιμο ρυθμίσεων" : "Ρυθμίσεις cookies"}
              </button>
            </div>

            {isExpanded ? (
              <div className="mt-4 space-y-3 pb-2">
                <ConsentToggle
                  label="Απολύτως απαραίτητα"
                  description="Απαιτούνται για βασικές λειτουργίες, όπως η σωστή πλοήγηση και η αποθήκευση κρίσιμων ρυθμίσεων."
                  checked
                  disabled
                />
                <ConsentToggle
                  label="Αναλυτικά / στατιστική χρήσης"
                  description="Χρησιμοποιούνται για κατανόηση της χρήσης του ιστότοπου και για εσωτερική βελτίωση της εμπειρίας."
                  checked={draftConsent.analytics}
                  onChange={(analytics) => setDraftConsent((current) => ({ ...current, analytics }))}
                />
                <ConsentToggle
                  label="Προτιμήσεις εμπειρίας"
                  description="Χρησιμοποιούνται για την αποθήκευση επιλογών που βελτιώνουν την εμπειρία σας σε επόμενες επισκέψεις."
                  checked={draftConsent.preferences}
                  onChange={(preferences) => setDraftConsent((current) => ({ ...current, preferences }))}
                />

                <div
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: "rgba(29,78,216,0.06)",
                    border: `1px solid ${D.accentBorderSoft}`,
                  }}
                >
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: D.accentStrong }} />
                  <p className="text-[0.88rem]" style={{ color: D.inkSoft, lineHeight: 1.65 }}>
                    Οι επιλογές σας αποθηκεύονται ήδη τοπικά και μπορείτε να τις ανοίγετε ξανά από το footer. Η πλήρης τεχνική εφαρμογή τους σε όλα τα μη απολύτως απαραίτητα εργαλεία ολοκληρώνεται στο επόμενο στάδιο.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="mt-4 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between shrink-0"
            style={{
              paddingTop: isExpanded ? "0.7rem" : undefined,
              borderTop: isExpanded ? `1px solid ${D.border}` : undefined,
              background: isExpanded ? "rgba(255,255,255,0.88)" : undefined,
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[0.88rem] transition-opacity hover:opacity-95"
                style={{
                  background: D.ink,
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                Αποδοχή όλων
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[0.88rem] transition-colors"
                style={{
                  background: "rgba(248,250,252,0.92)",
                  color: D.ink,
                  border: `1px solid ${D.border}`,
                  fontWeight: 700,
                }}
              >
                Απόρριψη μη απαραίτητων
              </button>
            </div>

            {isExpanded ? (
              <button
                type="button"
                onClick={handleSaveSelection}
                className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[0.88rem] transition-colors"
                style={{
                  color: D.accentStrong,
                  background: "rgba(29,78,216,0.08)",
                  border: `1px solid ${D.accentBorderSoft}`,
                  fontWeight: 800,
                }}
              >
                Αποθήκευση επιλογών
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
