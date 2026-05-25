export const OVERLAY_VISIBILITY_CHANGED_EVENT = "delta:overlay-visibility-changed";

export type OverlayName = "newsletter" | "cookie-consent";
type OverlayVisibilityState = Record<OverlayName, boolean>;

declare global {
  interface Window {
    __deltaOverlayVisibility?: OverlayVisibilityState;
  }
}

function getOverlayStore(): OverlayVisibilityState {
  if (typeof window === "undefined") {
    return { newsletter: false, "cookie-consent": false };
  }

  if (!window.__deltaOverlayVisibility) {
    window.__deltaOverlayVisibility = {
      newsletter: false,
      "cookie-consent": false,
    };
  }

  return window.__deltaOverlayVisibility;
}

export function getOverlayVisibility(name: OverlayName) {
  return getOverlayStore()[name];
}

export function setOverlayVisibility(name: OverlayName, isVisible: boolean) {
  if (typeof window === "undefined") return;

  const store = getOverlayStore();
  if (store[name] === isVisible) return;

  store[name] = isVisible;
  window.dispatchEvent(
    new CustomEvent(OVERLAY_VISIBILITY_CHANGED_EVENT, {
      detail: { name, isVisible },
    }),
  );
}
