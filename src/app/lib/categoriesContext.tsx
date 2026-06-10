import { createContext, useContext, useEffect, useState } from "react";
import { getCategories, MOCK_HUBS } from "./deltaApi";
import { ENABLE_MOCK_FALLBACKS } from "./api/core";
import type { DeltaHub } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoriesContextValue {
  /** Live categories from wp/v2/categories (or MOCK_HUBS as fallback) */
  hubs: DeltaHub[];
  /** True while the initial fetch is in-flight */
  loading: boolean;
  /** True when the data came from the mock fallback (no live API) */
  isMock: boolean;
  /** True when live categories could not be loaded and no production fallback was used */
  sourceUnavailable: boolean;
  /** Look up a hub by slug — handy for post normalisation */
  getHub: (slug: string) => DeltaHub | undefined;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CategoriesContext = createContext<CategoriesContextValue>({
  hubs: ENABLE_MOCK_FALLBACKS ? MOCK_HUBS : [],
  loading: true,
  isMock: ENABLE_MOCK_FALLBACKS,
  sourceUnavailable: false,
  getHub: (slug) => (ENABLE_MOCK_FALLBACKS ? MOCK_HUBS : []).find((h) => h.slug === slug),
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  // Initialise with mock hubs so every consumer renders immediately —
  // they'll re-render silently once the live data arrives.
  const [hubs, setHubs] = useState<DeltaHub[]>(ENABLE_MOCK_FALLBACKS ? MOCK_HUBS : []);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(ENABLE_MOCK_FALLBACKS);
  const [sourceUnavailable, setSourceUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategories().then(({ data, isMock: m, sourceUnavailable: unavailable }) => {
      if (cancelled) return;
      setHubs(data);
      setIsMock(m);
      setSourceUnavailable(unavailable);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const getHub = (slug: string) => hubs.find((h) => h.slug === slug);

  return (
    <CategoriesContext.Provider value={{ hubs, loading, isMock, sourceUnavailable, getHub }}>
      {children}
    </CategoriesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useContext(CategoriesContext);
}
