import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router";
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Euro,
  FileCheck2,
  GraduationCap,
  Headphones,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";
import { getProgramFilters, getPrograms } from "../lib/deltaApi";
import { trackContextualEvent, trackEvent } from "../lib/analytics";
import type { Program, FilterOptions } from "../lib/types";
import { MockBadge } from "../components/MockBadge";
import { SeoHead } from "../components/SeoHead";
import { programsSeo } from "../lib/seo";
import { D } from "../Root";
import { usePageNavigation } from "../lib/usePageNavigation";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "../components/ui/drawer";
import { useIsMobile } from "../components/ui/use-mobile";

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const _delay = delay;
  void _delay;
  return <>{children}</>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl animate-pulse ${className}`} style={{ background: "rgba(19,35,58,0.07)" }} />;
}

const modeColors: Record<string, string> = {
  "Υβριδικό": "#7c3aed",
  "Εξ Αποστάσεως": "#0891b2",
  "Δια Ζώσης": "#059669",
  "Online": "#0891b2",
  "In-person": "#059669",
  "Hybrid": "#7c3aed",
};

function ProgramCard({ program }: { program: Program }) {
  const modeColor = modeColors[program.summary.mode] || D.inkSoft;
  const categoryLabel = program.summary.category || program.taxonomies.category[0]?.name || "Πρόγραμμα";
  return (
    <Link
      to={`/courses/${program.slug}`}
      className="rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}`, borderRadius: D.radiusCard }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
      onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.45)")}
      onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
      aria-label={`Άνοιγμα προγράμματος: ${program.title}`}
      onClick={() =>
        trackEvent("program_card_click", {
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          page_type: "courses_index",
          content_type: "program",
          program_title: program.title,
          university: program.summary.university,
          source_section: "courses_grid",
        })
      }
    >
      {program.featuredImage && (
        <div className="overflow-hidden" style={{ height: "160px" }}>
          <img src={program.featuredImage.url} alt={program.featuredImage.alt} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        {/* Header tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs"
            style={{
              background: "linear-gradient(135deg, rgba(29,78,216,0.12), rgba(29,78,216,0.04))",
              border: "1px solid rgba(29,78,216,0.18)",
              color: D.accentStrong,
              fontWeight: 700,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            {categoryLabel}
          </span>
          {program.isFeatured && (
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: D.accentSoft, color: D.accentStrong }}>★ Featured</span>
          )}
        </div>

        {/* Title */}
        <h3 className="type-display-card mb-2 flex-1 line-clamp-2" style={{ fontSize: "0.9rem", letterSpacing: "-0.015em", color: D.ink, lineHeight: 1.4 }}>
          {program.title}
        </h3>
        <p className="text-xs mb-4 line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.5 }}>{program.excerpt}</p>

        {/* Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs" style={{ color: D.inkSoft }}>
            <GraduationCap size={12} style={{ color: D.accent, flexShrink: 0 }} />
            <span className="line-clamp-1">{program.summary.university}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: D.inkSoft }}>
            <MapPin size={12} style={{ color: modeColor, flexShrink: 0 }} />
            <span>{program.summary.mode}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: D.inkSoft }}>
            <Clock size={12} style={{ color: D.accent, flexShrink: 0 }} />
            <span>{program.summary.duration}</span>
          </div>
          {program.summary.tuition && (
            <div className="flex items-center gap-2 text-xs" style={{ color: D.inkSoft }}>
              <Euro size={12} style={{ color: D.accent, flexShrink: 0 }} />
              <span>€{program.summary.tuition}</span>
            </div>
          )}
        </div>

        {/* Deadline */}
        {program.summary.deadline && (
          <div className="mb-4 px-3 py-2 rounded-xl text-xs" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.2)`, color: D.accentStrong }}>
            Deadline αιτήσεων: <strong>{new Date(program.summary.deadline).toLocaleDateString("el-GR")}</strong>
          </div>
        )}

        <div
          className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all duration-200"
          style={{ background: D.ink, color: "#fff", fontWeight: 600 }}
        >
          Πλήρης Ενημέρωση <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  );
}

type FilterKey = "category" | "level" | "city" | "mode" | "university" | "uniType";
type FilterState = Record<FilterKey, string>;

const FILTER_LABELS: Record<FilterKey, string> = {
  category: "Κατηγορία",
  level: "Επίπεδο",
  city: "Πόλη",
  mode: "Τρόπος",
  university: "Πανεπιστήμιο",
  uniType: "Τύπος ιδρύματος",
};

const FILTER_OPTION_KEYS: Record<FilterKey, keyof FilterOptions> = {
  category: "category",
  level: "level",
  city: "city",
  mode: "mode",
  university: "university",
  uniType: "uni_type",
};

const COURSE_DISCOVERY_STEPS = [
  { label: "Αναζητήστε πρόγραμμα", icon: Search },
  { label: "Συγκρίνετε επιλογές", icon: ArrowLeftRight },
  { label: "Ζητήστε πληροφορίες", icon: MessageCircle },
  { label: "Λάβετε δωρεάν καθοδήγηση", icon: Headphones },
  {
    label: "Υποβάλετε αίτηση",
    detail: "Με τη βοήθεια της Delta Edu, εντελώς δωρεάν.",
    icon: FileCheck2,
  },
];

export function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Configure navigation for service mode
  usePageNavigation({
    mode: "service",
    cta: { text: "", link: "" },
    showStickyBottom: false, // Don't show sticky CTA on courses page itself
  });

  // URL-driven filters (no page in URL)
  const q = searchParams.get("q") || "";
  const activeCategory = searchParams.get("category") || "";
  const activeLevel = searchParams.get("level") || "";
  const activeCity = searchParams.get("city") || "";
  const activeMode = searchParams.get("mode") || "";
  const activeUniversity = searchParams.get("university") || "";
  const activeUniType = searchParams.get("uni_type") || "";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [sourceUnavailable, setSourceUnavailable] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterOptions | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const [qInput, setQInput] = useState(q);
  const currentFilters: FilterState = {
    category: activeCategory,
    level: activeLevel,
    city: activeCity,
    mode: activeMode,
    university: activeUniversity,
    uniType: activeUniType,
  };
  const [draftFilters, setDraftFilters] = useState<FilterState>(currentFilters);

  // Track filters and reset when they change
  const prevFiltersRef = useRef({ q, activeCategory, activeLevel, activeCity, activeMode, activeUniversity, activeUniType });
  
  useEffect(() => {
    let cancelled = false;

    if (filters) return;

    getProgramFilters().then((loadedFilters) => {
      if (cancelled || !loadedFilters) return;
      setFilters(loadedFilters);
    });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.q !== q ||
      prevFiltersRef.current.activeCategory !== activeCategory ||
      prevFiltersRef.current.activeLevel !== activeLevel ||
      prevFiltersRef.current.activeCity !== activeCity ||
      prevFiltersRef.current.activeMode !== activeMode ||
      prevFiltersRef.current.activeUniversity !== activeUniversity ||
      prevFiltersRef.current.activeUniType !== activeUniType;

    if (filtersChanged) {
      prevFiltersRef.current = { q, activeCategory, activeLevel, activeCity, activeMode, activeUniversity, activeUniType };
      // Reset to page 1 when filters change
      setPrograms([]);
      setCurrentPage(1);
      setLoading(true);
      
      getPrograms({ 
        page: 1, 
        q: q || undefined, 
        category: activeCategory || undefined,
        level: activeLevel || undefined, 
        city: activeCity || undefined, 
        mode: activeMode || undefined, 
        university: activeUniversity || undefined,
        uni_type: activeUniType || undefined,
      }).then(({ data, meta, isMock: m, sourceUnavailable: unavailable }) => {
        setPrograms(data);
        setTotalPages(meta.totalPages);
        setTotal(meta.total);
        setIsMock(m);
        setSourceUnavailable(unavailable);
        setLoading(false);
      });
      return;
    }

    // Normal fetch (initial load or load more)
    const isLoadMore = currentPage > 1;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    getPrograms({ 
      page: currentPage, 
      q: q || undefined, 
      category: activeCategory || undefined,
      level: activeLevel || undefined, 
      city: activeCity || undefined, 
      mode: activeMode || undefined, 
      university: activeUniversity || undefined,
      uni_type: activeUniType || undefined,
    }).then(({ data, meta, isMock: m, sourceUnavailable: unavailable }) => {
      if (isLoadMore) {
        // Append new programs
        setPrograms(prev => [...prev, ...data]);
      } else {
        // Replace programs (initial load)
        setPrograms(data);
      }
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
      setIsMock(m);
      setSourceUnavailable(unavailable);
      setLoading(false);
      setLoadingMore(false);
    });
  }, [currentPage, q, activeCategory, activeLevel, activeCity, activeMode, activeUniversity, activeUniType]);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      return params;
    });
  };

  const activeFiltersCount = [activeCategory, activeLevel, activeCity, activeMode, activeUniversity, activeUniType].filter(Boolean).length;
  const hasMore = currentPage < totalPages;
  const remainingCount = total - programs.length;

  useEffect(() => {
    setDraftFilters(currentFilters);
  }, [activeCategory, activeLevel, activeCity, activeMode, activeUniversity, activeUniType]);

  const openFiltersPanel = () => {
    setDraftFilters(currentFilters);
    setShowFilters(true);
  };

  const buildFilterSummary = (state: FilterState) =>
    (Object.entries(state) as [FilterKey, string][])
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${key}:${value}`)
      .join(" | ");

  const trackCoursesFilterApply = (
    key: FilterKey,
    value: string,
    interactionMode: "desktop" | "mobile_apply",
    nextState: FilterState,
  ) => {
    trackContextualEvent("courses_filter_apply", {
      filter_name: key,
      filter_value: getFilterValueLabel(key, value),
      interaction_mode: interactionMode,
      active_filters_count: Object.values(nextState).filter(Boolean).length,
      filters_summary: buildFilterSummary(nextState) || undefined,
      search_term: q || undefined,
    });
  };

  const trackCoursesFilterClear = (
    clearMode: "all" | "single" | "mobile_apply",
    key?: FilterKey,
    nextState?: FilterState,
  ) => {
    const stateAfterClear = nextState || currentFilters;
    trackContextualEvent("courses_filter_clear", {
      cleared_filter_name: key,
      clear_mode: clearMode,
      active_filters_count: Object.values(stateAfterClear).filter(Boolean).length,
      filters_summary: buildFilterSummary(stateAfterClear) || undefined,
      search_term: q || undefined,
    });
  };

  const handleDesktopFilterChange = (key: FilterKey, value: string) => {
    if (value === currentFilters[key]) return;

    const nextState = { ...currentFilters, [key]: value };
    if (!value && currentFilters[key]) {
      trackCoursesFilterClear("single", key, nextState);
    } else if (value) {
      trackCoursesFilterApply(key, value, "desktop", nextState);
    }

    updateParams({ [getParamKey(key)]: value || undefined });
  };

  const handleLoadMore = () => {
    trackContextualEvent("courses_load_more", {
      current_page: currentPage,
      visible_program_count: programs.length,
      remaining_count: remainingCount,
      search_term: q || undefined,
      active_filters_count: activeFiltersCount,
    });
    setCurrentPage(prev => prev + 1);
  };

  const clearFilters = () => {
    if (activeFiltersCount > 0) {
      trackCoursesFilterClear("all", undefined, {
        category: "",
        level: "",
        city: "",
        mode: "",
        university: "",
        uniType: "",
      });
    }
    updateParams({ category: undefined, level: undefined, city: undefined, mode: undefined, university: undefined, uni_type: undefined });
  };

  const clearDraftFilters = () => {
    setDraftFilters({
      category: "",
      level: "",
      city: "",
      mode: "",
      university: "",
      uniType: "",
    });
  };

  const applyDraftFilters = () => {
    const changedKeys = (Object.keys(draftFilters) as FilterKey[]).filter(
      (key) => draftFilters[key] !== currentFilters[key],
    );

    changedKeys.forEach((key) => {
      if (!draftFilters[key] && currentFilters[key]) {
        trackCoursesFilterClear("mobile_apply", key, draftFilters);
        return;
      }

      if (draftFilters[key]) {
        trackCoursesFilterApply(key, draftFilters[key], "mobile_apply", draftFilters);
      }
    });

    updateParams({
      category: draftFilters.category,
      level: draftFilters.level,
      city: draftFilters.city,
      mode: draftFilters.mode,
      university: draftFilters.university,
      uni_type: draftFilters.uniType,
    });
    setShowFilters(false);
  };

  const removeSingleFilter = (key: FilterKey) => {
    const nextState = { ...currentFilters, [key]: "" };
    trackCoursesFilterClear("single", key, nextState);
    updateParams({ [key === "uniType" ? "uni_type" : key]: undefined });
  };

  const getFilterValueLabel = (key: FilterKey, value: string) => {
    const match = filters?.[FILTER_OPTION_KEYS[key]]?.find((option) => option.value === value);
    return match?.label || value;
  };

  const renderDropdownFilter = (label: string, key: FilterKey, activeVal: string, setVal: (v: string) => void) => {
    const opts = filters?.[FILTER_OPTION_KEYS[key]] || [];
    if (!opts.length) return null;

    return (
      <label className="block min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="type-eyebrow text-[10px]" style={{ color: D.inkSoft }}>{label}</span>
          {activeVal && <span className="text-[10px] font-semibold" style={{ color: D.accentStrong }}>Ενεργό</span>}
        </div>
        <div className="relative">
          <select
            value={activeVal}
            onChange={(e) => setVal(e.target.value)}
          className="w-full appearance-none rounded-2xl px-3.5 py-3 pr-9 text-sm outline-none transition-colors"
          style={{
            background: activeVal ? D.accentSoft : D.surfaceStrong,
            border: `1px solid ${activeVal ? "rgba(37,99,235,0.28)" : D.border}`,
            color: activeVal ? D.accentStrong : D.ink,
            fontWeight: activeVal ? 700 : 500,
            borderRadius: D.radiusControl,
          }}
          >
            <option value="">Όλα</option>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: activeVal ? D.accentStrong : D.inkSoft }} />
        </div>
      </label>
    );
  };

  const getParamKey = (key: FilterKey) => key === "uniType" ? "uni_type" : key;
  const filterKeys: FilterKey[] = ["category", "level", "city", "mode", "uniType", "university"];

  const desktopFilters = filters ? (
    <div className="mt-4 rounded-[28px] p-4 md:p-5" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusShell }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filterKeys.map((key) => (
          <div key={key}>
            {renderDropdownFilter(FILTER_LABELS[key], key, currentFilters[key], (value) => handleDesktopFilterChange(key, value))}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const filterGroups = (
      <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3">
        {filterKeys.map((key) => (
          <div key={key}>
            {renderDropdownFilter(FILTER_LABELS[key], key, draftFilters[key], (value) => setDraftFilters((prev) => ({ ...prev, [key]: value })))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={programsSeo(Boolean(activeFiltersCount || q))} />
      {/* Header */}
      <section className="pt-36 pb-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="type-eyebrow inline-block px-3 py-1 rounded-full" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.25)`, color: D.accentStrong }}>
                Μεταπτυχιακά
              </span>
              {isMock && <MockBadge />}
            </div>
            <h1 className="type-display-hero mb-3" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: D.ink }}>
              Βρείτε το κατάλληλο μεταπτυχιακό για εσάς
            </h1>
            <p style={{ color: D.inkSoft, fontSize: "1.05rem", maxWidth: "720px" }}>
              Συγκρίνετε μεταπτυχιακά προγράμματα από Ελλάδα και Κύπρο, φιλτράρετε βάσει ειδικότητας, κόστους και τρόπου φοίτησης και ζητήστε δωρεάν ενημέρωση για όσα σας ενδιαφέρουν.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-10" aria-labelledby="courses-how-it-works">
        <div className="max-w-7xl mx-auto">
          <h2 id="courses-how-it-works" className="type-display-section mb-6" style={{ color: D.ink, fontSize: "1.4rem" }}>
            Πώς λειτουργεί;
          </h2>
          <div className="relative">
            <div
              className="absolute left-5 top-5 bottom-5 w-px md:left-[10%] md:right-[10%] md:top-5 md:h-px md:w-auto"
              style={{ background: D.border }}
              aria-hidden="true"
            />
            <ol className="relative grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-4">
              {COURSE_DISCOVERY_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <li key={step.label} className="flex min-w-0 items-start gap-3 md:block md:text-center">
                    <span
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:mx-auto md:mb-3"
                      style={{ background: D.accentSoft, color: D.accentStrong, boxShadow: `0 0 0 6px ${D.bg}` }}
                      aria-hidden="true"
                    >
                      <StepIcon size={18} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 pt-0.5 md:pt-0">
                      <div className="mb-1 text-[10px] font-bold uppercase" style={{ color: D.accentStrong }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: D.ink, lineHeight: 1.35 }}>
                        {step.label}
                      </h3>
                      {step.detail ? (
                        <p className="mt-1 text-xs" style={{ color: D.inkSoft, lineHeight: 1.5 }}>
                          {step.detail}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section className="px-6 pb-6" style={{ borderBottom: `1px solid ${D.border}` }}>
        <div className="max-w-7xl mx-auto">
          <form onSubmit={(e) => {
            e.preventDefault();
            const nextSearch = qInput.trim();
            trackContextualEvent("courses_search_submit", {
              search_term: nextSearch || "(empty)",
              active_filters_count: activeFiltersCount,
              visible_program_count: programs.length,
            });
            updateParams({ q: nextSearch });
          }} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full sm:flex-1" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 8px ${D.shadow}`, borderRadius: D.radiusCard }}>
              <Search size={16} style={{ color: "rgba(19,35,58,0.35)" }} />
              <input type="text" placeholder="Πληκτρολογήστε ειδικότητα, πανεπιστήμιο ή επάγγελμα (π.χ. Ψυχολογία, Ειδική Αγωγή, MBA)" value={qInput} onChange={(e) => setQInput(e.target.value)} className="min-w-0 bg-transparent outline-none flex-1 text-sm placeholder:text-black/30" style={{ color: D.ink }} />
            </div>
            <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto">
              <button type="submit" className="w-full px-5 py-3 rounded-2xl text-sm transition-all hover:opacity-90" style={{ background: D.ink, color: "#fff", fontWeight: 600, minHeight: "48px", borderRadius: D.radiusControl }}>
                Αναζήτηση
              </button>
              <button
                type="button"
                onClick={openFiltersPanel}
                aria-expanded={showFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm transition-all md:hidden"
                style={showFilters || activeFiltersCount > 0 ? { background: D.accentSoft, border: `1px solid ${D.accent}55`, color: D.accentStrong, fontWeight: 600, minHeight: "48px", borderRadius: D.radiusControl } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, minHeight: "48px", borderRadius: D.radiusControl }}
              >
                <SlidersHorizontal size={15} />
                <span>Φίλτρα</span>
                {activeFiltersCount > 0 && <span className="ml-0.5 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ background: D.accentStrong }}>{activeFiltersCount}</span>}
              </button>
            </div>
          </form>

          <div className="hidden md:block">
            {desktopFilters}
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(Object.entries(currentFilters) as [FilterKey, string][]).filter(([, value]) => Boolean(value)).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => removeSingleFilter(key)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                >
                  <span style={{ color: D.ink }}>{FILTER_LABELS[key]}:</span>
                  <span>{getFilterValueLabel(key, value)}</span>
                  <X size={12} />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="text-xs font-semibold transition-colors" style={{ color: D.accentStrong }}>
                Καθαρισμός όλων
              </button>
            </div>
          )}
        </div>
      </section>

      {filters && isMobile && (
        <Drawer open={showFilters} onOpenChange={setShowFilters}>
          <DrawerContent className="max-h-[88vh] border-0 p-0" style={{ background: D.surfaceStrong }}>
            <DrawerHeader className="gap-2 px-6 pt-6 pb-4 text-left">
              <DrawerTitle className="type-ui-label" style={{ color: D.ink }}>Φίλτρα Αναζήτησης</DrawerTitle>
              <DrawerDescription style={{ color: D.inkSoft }}>
                Επιλέξτε κριτήρια από τα dropdowns και εφαρμόστε τα όταν είστε έτοιμοι.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 pb-6 overflow-y-auto">
              {filterGroups}
            </div>
            <DrawerFooter className="border-t px-6 py-4" style={{ borderColor: D.border, background: D.surfaceStrong, boxShadow: `0 -8px 24px ${D.shadow}` }}>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={clearDraftFilters} className="px-4 py-3 rounded-2xl text-sm font-semibold transition-all" style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.inkSoft, borderRadius: D.radiusControl }}>
                  Καθαρισμός
                </button>
                <button type="button" onClick={applyDraftFilters} className="px-4 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: D.ink, color: "#fff", borderRadius: D.radiusControl }}>
                  Εφαρμογή
                </button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Results */}
      <section className="px-6 py-12 pb-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-80" />)}
            </div>
          ) : sourceUnavailable ? (
            <div className="text-center py-24" style={{ color: D.inkSoft }}>
              <p className="mb-3" style={{ color: D.ink, fontWeight: 700 }}>
                Δεν ήταν δυνατή η φόρτωση των προγραμμάτων.
              </p>
              <p className="text-sm max-w-md mx-auto" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                Η ζωντανή πηγή προγραμμάτων δεν αποκρίθηκε αυτή τη στιγμή, οπότε η σελίδα δεν εμφανίζει πλέον δοκιμαστικά δεδομένα.
              </p>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-24" style={{ color: D.inkSoft }}>
              <p className="mb-3">Δεν βρέθηκαν προγράμματα.</p>
              {activeFiltersCount > 0 && <button onClick={clearFilters} className="text-sm" style={{ color: D.accent }}>Καθαρισμός φίλτρων</button>}
            </div>
          ) : (
            <div className="space-y-8">
              <AnimatedSection>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="type-meta text-sm" style={{ color: D.inkSoft }}>{total} προγράμματα</p>
                  {activeFiltersCount > 0 && (
                    <p className="type-meta text-xs" style={{ color: D.inkSoft }}>
                      {activeFiltersCount} ενεργά φίλτρα
                    </p>
                  )}
                </div>
              </AnimatedSection>

              <div id="programs-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {programs.map((prog, i) => (
                  <AnimatedSection key={prog.id} delay={i * 0.06}>
                    <ProgramCard program={prog} />
                  </AnimatedSection>
                ))}
              </div>

              {/* Load More Section */}
              {hasMore && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  {loadingMore ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-80" />
                      ))}
                    </div>
                  ) : (
                  <>
                      <p className="text-xs md:text-sm text-center mb-1" style={{ color: D.inkSoft }}>
                        Βλέπετε {programs.length.toLocaleString("el-GR")} από {total.toLocaleString("el-GR")} προγράμματα
                      </p>
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center gap-2"
                        style={{ background: D.surfaceStrong, color: D.accentStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 10px rgba(15,23,42,0.05)` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = D.accentSoft;
                          e.currentTarget.style.borderColor = "rgba(47, 91, 171, 0.28)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = D.surfaceStrong;
                          e.currentTarget.style.borderColor = D.border;
                        }}
                      >
                        Φόρτωσε περισσότερα προγράμματα <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
