export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_STORAGE_KEY = "delta_cookie_consent";
export const COOKIE_SETTINGS_OPEN_EVENT = "delta:open-cookie-settings";
export const COOKIE_CONSENT_UPDATED_EVENT = "delta:cookie-consent-updated";

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  preferences: false,
  updatedAt: "",
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isConsentShape(value: unknown): value is CookieConsent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CookieConsent>;
  return (
    candidate.necessary === true &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.preferences === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
}

function emitConsentUpdated(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: consent }));
}

export function getDefaultCookieConsent(): CookieConsent {
  return DEFAULT_CONSENT;
}

export function getStoredCookieConsent(): CookieConsent | null {
  if (!canUseBrowserStorage()) return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isConsentShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function hasCookieConsentChoice() {
  return getStoredCookieConsent() !== null;
}

export function saveCookieConsent(input: Omit<CookieConsent, "updatedAt"> | CookieConsent) {
  const consent: CookieConsent = {
    necessary: true,
    analytics: input.analytics,
    preferences: input.preferences,
    updatedAt: "updatedAt" in input && input.updatedAt ? input.updatedAt : new Date().toISOString(),
  };

  if (!canUseBrowserStorage()) return consent;

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  emitConsentUpdated(consent);
  return consent;
}

export function acceptAllCookieConsent() {
  return saveCookieConsent({
    necessary: true,
    analytics: true,
    preferences: true,
  });
}

export function rejectNonEssentialCookieConsent() {
  return saveCookieConsent({
    necessary: true,
    analytics: false,
    preferences: false,
  });
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT));
}
