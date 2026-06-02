import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { CategoriesProvider } from "./lib/categoriesContext";
import { NavigationProvider } from "./lib/navigationContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { StickyBottomCta } from "./components/StickyBottomCta";
import { BackToTopButton } from "./components/BackToTopButton";
import { PageLoader } from "./components/PageLoader";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { initAnalytics, trackPageView } from "./lib/analytics";

// Delta color palette constants (available globally via style)
export const D = {
  bg: "#F7FAFC",
  surface: "#FFFFFF",
  surfaceStrong: "#FFFFFF",
  ink: "#0F172A",
  inkSoft: "#475569",
  accent: "#1D4ED8",
  accentStrong: "#1D4ED8",
  accentSoft: "rgba(29,78,216,0.12)",
  accentWash: "rgba(29,78,216,0.06)",
  accentWashStrong: "rgba(29,78,216,0.035)",
  accentBorderSoft: "rgba(29,78,216,0.08)",
  warmAccent: "#B9985A",
  warmAccentStrong: "#B9985A",
  warmAccentSoft: "rgba(185,152,90,0.12)",
  warmAccentWash: "rgba(185,152,90,0.05)",
  warmAccentBorderSoft: "rgba(185,152,90,0.22)",
  heroMid: "#172554",
  heroTo: "#1E3A8A",
  border: "rgba(15,23,42,0.08)",
  borderStrong: "rgba(15,23,42,0.16)",
  headerGlass: "rgba(255,255,255,0.82)",
  shadow: "rgba(15,23,42,0.08)",
  radiusShell: "1.5rem",
  radiusCard: "1.25rem",
  radiusInner: "1rem",
  radiusControl: "0.875rem",
  radiusPill: "999px",
};

// Shared section surfaces keep large-page palette changes centralized.
export const sectionSurfaces = {
  homePaths: {
    background: `linear-gradient(180deg, rgba(29,78,216,0.075) 0%, ${D.accentWashStrong} 58%, rgba(255,255,255,0.78) 100%)`,
    borderTop: `1px solid ${D.accentBorderSoft}`,
    borderBottom: `1px solid ${D.border}`,
  },
  homeTrust: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.surface} 100%)`,
  },
  homeEditorial: {
    background: `linear-gradient(180deg, ${D.bg} 0%, rgba(255,255,255,0.82) 46%, ${D.bg} 100%)`,
  },
  homeTrustBand: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, ${D.surface} 100%)`,
    borderTop: `1px solid ${D.border}`,
    borderBottom: `1px solid ${D.border}`,
  },
  homePrograms: {
    background: `linear-gradient(180deg, ${D.accentWash} 0%, rgba(29,78,216,0.022) 62%, rgba(255,255,255,0.82) 100%)`,
  },
  homeFinalCta: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.86) 0%, ${D.bg} 100%)`,
  },
  hubControls: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, ${D.accentWashStrong} 100%)`,
    borderBottom: `1px solid ${D.border}`,
  },
  hubTopics: {
    background: "linear-gradient(180deg, rgba(29,78,216,0.07) 0%, rgba(29,78,216,0.028) 64%, rgba(255,255,255,0.86) 100%)",
    borderBottom: `1px solid ${D.border}`,
  },
  hubArticles: {
    background: `linear-gradient(180deg, ${D.bg} 0%, rgba(255,255,255,0.82) 48%, ${D.bg} 100%)`,
  },
  hubEditorialSecondary: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.surface} 100%)`,
    borderBottom: `1px solid ${D.border}`,
  },
  hubFaq: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, ${D.surface} 100%)`,
    borderTop: `1px solid ${D.border}`,
    borderBottom: `1px solid ${D.border}`,
  },
  hubRelated: {
    background: `linear-gradient(180deg, rgba(29,78,216,0.04) 0%, ${D.bg} 100%)`,
  },
};

const DeferredRootUi = lazy(async () => {
  const [{ ContactFormModal }, { NewsletterSlideIn }] = await Promise.all([
    import("./components/ContactFormModal"),
    import("./components/NewsletterSlideIn"),
  ]);

  return {
    default: function DeferredRootUiContent() {
      return (
        <>
          <ContactFormModal />
          <NewsletterSlideIn />
        </>
      );
    },
  };
});

function ScrollToTopOnPathChange() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");

      requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target) {
          const header = document.querySelector("header");
          const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
          const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

          window.scrollTo({
            top: Math.max(top, 0),
            left: 0,
            behavior: "auto",
          });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
      });

      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  return null;
}

function AnalyticsBootstrap() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      trackPageView(path);
    };

    const firstFrame = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export function Root() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [shouldLoadDeferredUi, setShouldLoadDeferredUi] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const enableDeferredUi = () => {
      if (!cancelled) setShouldLoadDeferredUi(true);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(enableDeferredUi, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = globalThis.setTimeout(enableDeferredUi, 0);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, []);

  return (
    <HelmetProvider>
      <CategoriesProvider>
        <NavigationProvider>
          <AnalyticsBootstrap />
          <ScrollToTopOnPathChange />
          {isLoading && <PageLoader />}
          <div
            className="min-h-screen flex flex-col"
            style={{ background: D.bg, fontFamily: "'Inter', sans-serif", color: D.ink }}
          >
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
            <StickyBottomCta />
            <BackToTopButton />
            <CookieConsentBanner />
            {shouldLoadDeferredUi ? (
              <Suspense fallback={null}>
                <DeferredRootUi />
              </Suspense>
            ) : null}
          </div>
        </NavigationProvider>
      </CategoriesProvider>
    </HelmetProvider>
  );
}
