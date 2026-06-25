import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getStoredCookieConsent,
  type CookieConsent,
} from "./cookieConsent";

const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || "G-6V7M5W9LNQ";
const GA_REQUIRES_ANALYTICS_CONSENT =
  import.meta.env.VITE_GA_REQUIRE_ANALYTICS_CONSENT === "true";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsInitialized = false;
let consentDefaultInitialized = false;
let consentListenerInitialized = false;
let analyticsConsentGranted = false;
let lastPageView: { path: string; title?: string } | null = null;

function hasDocument() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function ensureGtagStub() {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
  }
}

function hasAnalyticsConsent(consent = getStoredCookieConsent()) {
  if (!GA_REQUIRES_ANALYTICS_CONSENT) return true;
  return consent?.analytics === true;
}

function getConsentModeState(consent: CookieConsent | null) {
  const analyticsConsent = hasAnalyticsConsent(consent) ? "granted" : "denied";

  return {
    analytics_storage: analyticsConsent,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  };
}

function updateConsentMode(consent: CookieConsent, command: "default" | "update") {
  if (!hasDocument()) return;
  ensureGtagStub();
  window.gtag?.("consent", command, getConsentModeState(consent));
}

function ensureConsentDefault(consent: CookieConsent | null) {
  if (consentDefaultInitialized) return;
  ensureGtagStub();
  window.gtag?.("consent", "default", getConsentModeState(consent));
  consentDefaultInitialized = true;
}

function ensureConsentListener() {
  if (consentListenerInitialized) return;

  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, (event) => {
    const consent = (event as CustomEvent<CookieConsent>).detail;
    if (!consent) return;

    const wasAnalyticsConsentGranted = analyticsConsentGranted;
    analyticsConsentGranted = hasAnalyticsConsent(consent);
    updateConsentMode(consent, "update");

    if (!analyticsConsentGranted || wasAnalyticsConsentGranted) return;

    configureAnalytics();

    const pageView = lastPageView ?? {
      path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      title: document.title,
    };
    sendPageView(pageView.path, pageView.title);
  });

  consentListenerInitialized = true;
}

function configureAnalytics() {
  if (analyticsInitialized || !GA_MEASUREMENT_ID) return;
  ensureConsentDefault(getStoredCookieConsent());
  ensureConsentListener();
  ensureGtagStub();

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-ga-id="${GA_MEASUREMENT_ID}"]`,
  );

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.dataset.gaId = GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

  analyticsInitialized = true;
}

export function initAnalytics() {
  if (!hasDocument() || !GA_MEASUREMENT_ID) return;

  const consent = getStoredCookieConsent();
  ensureGtagStub();
  ensureConsentDefault(consent);
  ensureConsentListener();
  analyticsConsentGranted = hasAnalyticsConsent(consent);

  if (analyticsConsentGranted) {
    configureAnalytics();
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;
type LeadFormEventName =
  | "lead_form_view"
  | "lead_form_start"
  | "lead_form_submit"
  | "lead_form_success"
  | "lead_form_failure";

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function getPageAnalyticsContext(pathname: string): EventParams {
  const normalizedPath = normalizePath(pathname);
  const segments = normalizedPath.split("/").filter(Boolean);

  if (normalizedPath === "/") {
    return {
      page_type: "home",
      content_type: "page",
      device_type: getDeviceType(),
    };
  }

  if (normalizedPath === "/contact") {
    return {
      page_type: "contact_page",
      content_type: "page",
      device_type: getDeviceType(),
    };
  }

  if (normalizedPath === "/about") {
    return {
      page_type: "about_page",
      content_type: "page",
      device_type: getDeviceType(),
    };
  }

  if (normalizedPath === "/blog") {
    return {
      page_type: "blog_index",
      content_type: "page",
      device_type: getDeviceType(),
    };
  }

  if (normalizedPath.startsWith("/blog/") && segments[1]) {
    return {
      page_type: "blog_article",
      content_type: "article",
      article_slug: segments[1],
      device_type: getDeviceType(),
    };
  }

  if (normalizedPath === "/courses") {
    return {
      page_type: "courses_index",
      content_type: "program",
      device_type: getDeviceType(),
    };
  }

  if (normalizedPath.startsWith("/courses/") && segments[1]) {
    return {
      page_type: "program_detail",
      content_type: "program",
      program_slug: segments[1],
      device_type: getDeviceType(),
    };
  }

  if (segments.length === 1) {
    return {
      page_type: `hub_${segments[0]}`,
      content_type: "hub",
      hub: segments[0],
      device_type: getDeviceType(),
    };
  }

  return {
    page_type: "page",
    content_type: "page",
    device_type: getDeviceType(),
  };
}

export function getCurrentPageAnalyticsContext(): EventParams {
  if (!hasDocument()) return { device_type: "unknown" };
  return getPageAnalyticsContext(window.location.pathname);
}

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (!hasDocument() || !hasAnalyticsConsent()) return;
  configureAnalytics();
  window.gtag?.("event", eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  });
}

function sendPageView(path: string, title?: string) {
  if (!hasDocument()) return;
  const pathnameOnly = normalizePath(path.split("#")[0]?.split("?")[0] || "/");

  window.gtag?.("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
    ...getPageAnalyticsContext(pathnameOnly),
  });
}

export function trackPageView(path: string, title?: string) {
  if (!hasDocument()) return;
  lastPageView = { path, title };
  if (!hasAnalyticsConsent()) return;
  configureAnalytics();
  sendPageView(path, title);
}

export function trackContextualEvent(
  eventName: string,
  extra: EventParams = {},
) {
  trackEvent(eventName, {
    ...getCurrentPageAnalyticsContext(),
    page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...extra,
  });
}

export function trackCtaClick(
  ctaLabel: string,
  ctaLocation: string,
  extra: EventParams = {},
) {
  trackContextualEvent("cta_click", {
    cta_label: ctaLabel,
    cta_location: ctaLocation,
    ...extra,
  });
}

export function trackNavClick(
  navLabel: string,
  navLocation: string,
  extra: EventParams = {},
) {
  trackContextualEvent("nav_click", {
    nav_label: navLabel,
    nav_location: navLocation,
    ...extra,
  });
}

export function trackFooterLinkClick(
  linkLabel: string,
  footerSection: string,
  extra: EventParams = {},
) {
  trackContextualEvent("footer_link_click", {
    link_label: linkLabel,
    footer_section: footerSection,
    ...extra,
  });
}

export function trackContactIntent(
  actionType: "phone" | "email",
  actionLocation: string,
  extra: EventParams = {},
) {
  trackContextualEvent(
    actionType === "phone" ? "contact_click_phone" : "contact_click_email",
    {
      action_location: actionLocation,
      ...extra,
    },
  );
}

export function trackLeadFormEvent(
  eventName: LeadFormEventName,
  extra: EventParams = {},
) {
  trackContextualEvent(eventName, extra);
}

export function getDeviceType() {
  if (!hasDocument()) return "unknown";
  return window.innerWidth < 640 ? "mobile" : "desktop";
}

export function getAnalyticsMeasurementId() {
  return GA_MEASUREMENT_ID;
}
