import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Search, SlidersHorizontal, X, Tag, Calendar, TrendingUp } from "lucide-react";
import { getPosts, getTags } from "../lib/deltaApi";
import { useCategories } from "../lib/categoriesContext";
import type { BlogPost, DeltaTaxonomyTerm } from "../lib/types";
import { MockBadge } from "../components/MockBadge";
import { SeoHead } from "../components/SeoHead";
import { blogIndexSeo } from "../lib/seo";
import { D } from "../Root";
import { StackedArticleCard } from "../components/articles/StackedArticleCard";
import { BlogTopicConstellation } from "../components/BlogTopicConstellation";

const REGULAR_POSTS_BATCH = 6;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric" });
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const _delay = delay;
  void _delay;
  return <>{children}</>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl animate-pulse ${className}`} style={{ background: "rgba(19,35,58,0.07)" }} />;
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <StackedArticleCard
      post={post}
      dateLabel={formatDate(post.publishedAt)}
      imageHeight="188px"
      footerMode="read"
      footerBordered
      footerCalendar
      titleClassName="mb-2 flex-1 line-clamp-3"
      titleStyle={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "-0.015em", color: D.ink, lineHeight: 1.4 }}
      excerptClassName="text-xs mb-4 line-clamp-2"
      excerptStyle={{ color: D.inkSoft, lineHeight: 1.6 }}
    />
  );
}

export function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeHub = searchParams.get("hub") || "";
  const search = searchParams.get("search") || "";
  const activeTag = searchParams.get("tag") || "";
  const activeSort = searchParams.get("sort") || "";
  
  const [regularPosts, setRegularPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [sourceUnavailable, setSourceUnavailable] = useState(false);
  const [requestOffset, setRequestOffset] = useState(0);
  const [cursorOffset, setCursorOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [tags, setTags] = useState<DeltaTaxonomyTerm[]>([]);

  // Live categories for filter pills
  const { hubs } = useCategories();

  // Fetch tags on mount
  useEffect(() => {
    getTags().then(({ data }) => setTags(data));
  }, []);

  // Track previous filter values to detect changes and reset page atomically
  const prevFiltersRef = useRef({ hub: activeHub, search, tag: activeTag, sort: activeSort });

  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.hub !== activeHub ||
      prevFiltersRef.current.search !== search ||
      prevFiltersRef.current.tag !== activeTag ||
      prevFiltersRef.current.sort !== activeSort;

    if (filtersChanged) {
      prevFiltersRef.current = { hub: activeHub, search, tag: activeTag, sort: activeSort };
      setRegularPosts([]);
      setHasMore(false);
      setTotal(0);
      setCursorOffset(0);
      if (requestOffset !== 0) {
        setRequestOffset(0);
        return;
      }
    }

    const isLoadMore = requestOffset > 0;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    let cancelled = false;

    const loadBatch = async () => {
      const { data, meta, isMock: m, sourceUnavailable: unavailable } = await getPosts({
        offset: requestOffset,
        perPage: REGULAR_POSTS_BATCH,
        hub: activeHub || undefined,
        search: search || undefined,
        tag: activeTag || undefined,
        sort: activeSort || undefined,
      });

      if (cancelled) return;

      const nextCursor = requestOffset + data.length;

      setRegularPosts((prev) => (isLoadMore ? [...prev, ...data] : data));
      setCursorOffset(nextCursor);
      setHasMore(nextCursor < meta.total);
      setTotal(meta.total);
      setIsMock(m);
      setSourceUnavailable(unavailable);
      setLoading(false);
      setLoadingMore(false);
    };

    void loadBatch();

    return () => {
      cancelled = true;
    };
  }, [requestOffset, activeHub, search, activeTag, activeSort]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setRequestOffset(cursorOffset);
  };

  const activeFiltersCount = [activeHub, activeTag, activeSort].filter(Boolean).length;

  const clearFilters = () => {
    updateParams({ hub: undefined, tag: undefined, sort: undefined, search: undefined });
    setSearchInput("");
  };

  const visibleCount = regularPosts.length;

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={blogIndexSeo(Boolean(activeHub || search || activeTag || activeSort))} />
      {/* Header */}
      <section className="pt-36 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(197,141,42,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:items-center">
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="inline-block px-3 py-1 rounded-full text-xs tracking-widest uppercase" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.25)`, color: D.accentStrong }}>
                  Blog
                </span>
                {isMock && <MockBadge />}
              </div>
              <h1 className="mb-3" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.04em", lineHeight: 1, color: D.ink }}>
                Άρθρα & Οδηγοί
              </h1>
              <p style={{ color: D.inkSoft, fontSize: "1.05rem", maxWidth: "460px" }}>
                Αναλυτικά άρθρα για ΟΠΣΥΔ, ΑΣΕΠ, μεταπτυχιακά και πιστοποιήσεις.
              </p>
            </div>
            <div className="hidden lg:flex justify-end">
              <BlogTopicConstellation />
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters Bar */}
      <section className="px-6 pb-6" style={{ borderBottom: `1px solid ${D.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-md" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
              <Search size={14} style={{ color: "rgba(19,35,58,0.35)" }} />
              <input
                type="text"
                placeholder="Αναζήτηση άρθρων..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/30"
                style={{ color: D.ink }}
              />
            </form>
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={showFilters || activeFiltersCount > 0 ? { background: D.accentSoft, border: `1px solid rgba(197,141,42,0.35)`, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
            >
              <SlidersHorizontal size={15} />
              Φίλτρα {activeFiltersCount > 0 && <span className="ml-0.5 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ background: D.accentStrong }}>{activeFiltersCount}</span>}
            </button>
          </div>

          {/* Hub Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateParams({ hub: undefined })}
              className="px-3.5 py-2 rounded-xl text-xs transition-all duration-200"
              style={!activeHub ? { background: D.ink, color: "#fff", fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
            >
              Όλα
            </button>
            {hubs.map((hub) => (
              <Link
                key={hub.slug}
                to={`/${hub.slug}`}
                className="px-3.5 py-2 rounded-xl text-xs transition-all duration-200"
                style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = D.accentSoft; (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.35)"; (e.currentTarget as HTMLElement).style.color = D.accentStrong; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = D.surfaceStrong; (e.currentTarget as HTMLElement).style.borderColor = D.border; (e.currentTarget as HTMLElement).style.color = D.inkSoft; }}
              >
                {hub.name}
                {hub.count ? <span className="ml-1 opacity-50">({hub.count})</span> : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-6 py-6 overflow-hidden"
          style={{ background: D.surface, borderBottom: `1px solid ${D.border}` }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: D.ink }}>Φίλτρα Αναζήτησης</h3>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs transition-colors" style={{ color: D.inkSoft }}>
                  <X size={12} /> Καθαρισμός φίλτρων
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tags Filter */}
              {tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs mb-3 tracking-widest uppercase" style={{ color: D.inkSoft, letterSpacing: "0.1em" }}>
                    <Tag size={12} /> Ετικέτες
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => updateParams({ tag: undefined })} 
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={!activeTag ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                    >
                      Όλες
                    </button>
                    {tags.slice(0, 10).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => updateParams({ tag: activeTag === String(tag.id) ? undefined : String(tag.id) })}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={activeTag === String(tag.id) ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort Filter */}
              <div>
                <div className="flex items-center gap-2 text-xs mb-3 tracking-widest uppercase" style={{ color: D.inkSoft, letterSpacing: "0.1em" }}>
                  <TrendingUp size={12} /> Ταξινόμηση
                </div>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => updateParams({ sort: undefined })} 
                    className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={!activeSort ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { color: D.inkSoft }}
                  >
                    <Calendar size={12} className="inline mr-2" />
                    Πιο Πρόσφατα
                  </button>
                  <button 
                    onClick={() => updateParams({ sort: activeSort === "oldest" ? undefined : "oldest" })} 
                    className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={activeSort === "oldest" ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { color: D.inkSoft }}
                  >
                    <Calendar size={12} className="inline mr-2" />
                    Παλαιότερα Πρώτα
                  </button>
                  <button 
                    onClick={() => updateParams({ sort: activeSort === "title" ? undefined : "title" })} 
                    className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={activeSort === "title" ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { color: D.inkSoft }}
                  >
                    Αλφαβητική Σειρά
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <section className="px-6 py-4" style={{ background: D.surface, borderBottom: `1px solid ${D.border}` }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: D.inkSoft }}>Ενεργά φίλτρα:</span>
              {search && (
                <button
                  onClick={() => { updateParams({ search: undefined }); setSearchInput(""); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  <Search size={10} /> "{search}" <X size={12} />
                </button>
              )}
              {activeHub && (
                <button
                  onClick={() => updateParams({ hub: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  {hubs.find(h => h.slug === activeHub)?.name} <X size={12} />
                </button>
              )}
              {activeTag && (
                <button
                  onClick={() => updateParams({ tag: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  <Tag size={10} /> {tags.find(t => String(t.id) === activeTag)?.name} <X size={12} />
                </button>
              )}
              {activeSort && (
                <button
                  onClick={() => updateParams({ sort: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  {activeSort === "oldest" ? "Παλαιότερα" : activeSort === "title" ? "Αλφαβητικά" : activeSort} <X size={12} />
                </button>
              )}
              <button
                onClick={clearFilters}
                className="text-xs ml-auto transition-colors hover:underline"
                style={{ color: D.accent }}
              >
                Καθαρισμός όλων
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="px-6 py-12 pb-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72" />)}
            </div>
          ) : sourceUnavailable ? (
            <div className="text-center py-24">
              <p className="mb-4" style={{ color: D.inkSoft }}>Δεν ήταν δυνατή η φόρτωση των άρθρων αυτή τη στιγμή.</p>
              <p className="text-sm" style={{ color: D.inkSoft }}>
                Δοκιμάστε ξανά σε λίγο ή ανανεώστε τη σελίδα.
              </p>
            </div>
          ) : regularPosts.length === 0 ? (
            <div className="text-center py-24">
              <p className="mb-4" style={{ color: D.inkSoft }}>Δεν βρέθηκαν άρθρα με τα επιλεγμένα κριτήρια.</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-sm transition-colors hover:underline" style={{ color: D.accent }}>
                  Καθαρισμός φίλτρων
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div id="blog-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {regularPosts.map((post, i) => (
                  <AnimatedSection key={post.id} delay={i * 0.06}>
                    <PostCard post={post} />
                  </AnimatedSection>
                ))}
              </div>

              {hasMore && (
                <AnimatedSection>
                  <div className="mt-10 flex flex-col items-center gap-3">
                    {loadingMore ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-72" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs md:text-sm text-center mb-1" style={{ color: D.inkSoft }}>
                          Βλέπετε {visibleCount.toLocaleString("el-GR")} από {total.toLocaleString("el-GR")} άρθρα
                        </p>
                        <button
                          type="button"
                          onClick={handleLoadMore}
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
                          Φόρτωσε περισσότερα άρθρα <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </button>
                      </>
                    )}
                  </div>
                </AnimatedSection>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
