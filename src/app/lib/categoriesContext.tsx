import { createContext, useContext, useEffect, useState } from "react";
import { getCategories, MOCK_HUBS } from "./deltaApi";
import type { DeltaHub } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoriesContextValue {
  /** Live categories from wp/v2/categories (or MOCK_HUBS as fallback) */
  hubs: DeltaHub[];
  /** True while the initial fetch is in-flight */
  loading: boolean;
  /** True when the data came from the mock fallback (no live API) */
  isMock: boolean;
  /** Look up a hub by slug — handy for post normalisation */
  getHub: (slug: string) => DeltaHub | undefined;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CategoriesContext = createContext<CategoriesContextValue>({
  hubs: MOCK_HUBS,
  loading: true,
  isMock: true,
  getHub: (slug) => MOCK_HUBS.find((h) => h.slug === slug),
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  // Initialise with mock hubs so every consumer renders immediately —
  // they'll re-render silently once the live data arrives.
  const [hubs, setHubs] = useState<DeltaHub[]>(MOCK_HUBS);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCategories().then(({ data, isMock: m }) => {
      if (cancelled) return;
      setHubs(data);
      setIsMock(m);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const getHub = (slug: string) => hubs.find((h) => h.slug === slug);

  return (
    <CategoriesContext.Provider value={{ hubs, loading, isMock, getHub }}>
      {children}
    </CategoriesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useContext(CategoriesContext);
}
