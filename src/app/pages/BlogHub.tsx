import { useRef, useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, BookOpen, Search, TrendingUp, Newspaper, Calendar } from "lucide-react";
import { getPosts } from "../lib/deltaApi";
import type { BlogPost } from "../lib/types";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { blogIndexSeo } from "../lib/seo";
import { usePageNavigation } from "../lib/usePageNavigation";
import { StackedArticleCard } from "../components/articles/StackedArticleCard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric" });
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

export function BlogHub() {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Configure navigation for content mode
  usePageNavigation({
    mode: "content",
    cta: { text: "Αναζήτηση Προγραμμάτων", link: "/courses" },
    showStickyBottom: true,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getPosts({ perPage: 3, page: 1 });
        if (res && res.data && Array.isArray(res.data)) {
          setFeaturedPosts(res.data.filter(p => p && p.id && p.title).slice(0, 3));
        } else {
          setFeaturedPosts([]);
        }
      } catch (error) {
        setFeaturedPosts([]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={blogIndexSeo(false)} />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 72%, rgba(37,99,235,0.035) 100%)`,
        }} />
        <div className="absolute left-1/2 top-20 hidden h-[360px] w-[760px] -translate-x-1/2 rounded-full blur-3xl md:block pointer-events-none" style={{ background: "rgba(37,99,235,0.07)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 0%, ${D.bg} 100%)` }} />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: D.accentSoft }}>
                <BookOpen size={28} style={{ color: D.accent }} />
              </div>
            </div>
            <h1 className="type-display-hero mb-6 mx-auto max-w-4xl" style={{ color: D.ink }}>
              Το Blog του Delta
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
              Οδηγοί, αναλύσεις και ενημερώσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις. Όλα όσα χρειάζεστε για την εκπαιδευτική σας πορεία.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link to="/blog" className="px-6 py-3 rounded-2xl flex items-center gap-2 transition-all hover:opacity-90" style={{ background: D.ink, color: "#fff", fontWeight: 600 }}>
                Εξερευνήστε Όλα τα Άρθρα <ArrowRight size={16} />
              </Link>
              <Link to="/blog?search=" className="px-6 py-3 rounded-2xl flex items-center gap-2 transition-all hover:opacity-90" style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 600 }}>
                <Search size={16} /> Αναζήτηση
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-7xl mx-auto pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Newspaper, label: "Άρθρα", value: "500+", desc: "Οδηγοί και αναλύσεις" },
              { icon: TrendingUp, label: "Ενημερώσεις", value: "Καθημερινά", desc: "Νέα από επίσημους φορείς" },
              { icon: Calendar, label: "Από το", value: "2018", desc: "Έγκυρη πληροφόρηση" },
            ].map((stat, idx) => (
              <AnimatedSection key={idx} delay={idx * 0.1}>
                <div className="p-8 rounded-3xl text-center" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: D.accentSoft }}>
                    <stat.icon size={24} style={{ color: D.accent }} />
                  </div>
                  <div className="type-stat mb-2" style={{ color: D.ink }}>
                    {stat.value}
                  </div>
                  <div className="mb-1" style={{ fontWeight: 600, fontSize: "0.9rem", color: D.ink }}>{stat.label}</div>
                  <p className="text-xs" style={{ color: D.inkSoft }}>{stat.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}`, background: D.surface }}>
        <div className="max-w-7xl mx-auto pt-16">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-10">
              <h2 className="type-display-section" style={{ color: D.ink }}>
                Τελευταία Άρθρα
              </h2>
              <Link to="/blog" className="text-sm flex items-center gap-1 hover:gap-2 transition-all" style={{ color: D.accent, fontWeight: 600 }}>
                Δείτε Όλα <ArrowRight size={14} />
              </Link>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, height: "400px" }}>
                  <div className="animate-pulse" style={{ background: "rgba(19,35,58,0.05)", height: "180px" }} />
                  <div className="p-5 space-y-3">
                    <div className="animate-pulse rounded-lg" style={{ background: "rgba(19,35,58,0.05)", height: "16px", width: "60%" }} />
                    <div className="animate-pulse rounded-lg" style={{ background: "rgba(19,35,58,0.05)", height: "60px" }} />
                    <div className="animate-pulse rounded-lg" style={{ background: "rgba(19,35,58,0.05)", height: "12px", width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.filter(post => post && post.id && post.title).map((post, idx) => (
                <AnimatedSection key={post.id} delay={idx * 0.1}>
                  <StackedArticleCard
                    post={post}
                    dateLabel={formatDate(post.publishedAt)}
                    imageHeight="200px"
                    contentClassName="p-6"
                    showChip={false}
                    footerMode="read"
                    footerBordered
                    titleClassName="type-display-card mb-3 line-clamp-2"
                    titleStyle={{ color: D.ink, lineHeight: 1.35 }}
                    excerptClassName="text-sm mb-4 line-clamp-2"
                    excerptStyle={{ color: D.inkSoft, lineHeight: 1.6 }}
                  />
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories CTA */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-7xl mx-auto pt-16">
          <AnimatedSection>
            <h2 className="type-display-section mb-10 text-center" style={{ color: D.ink }}>
              Εξερευνήστε ανά Κατηγορία
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "ΑΣΕΠ", slug: "asep", desc: "Προκηρύξεις & οδηγοί" },
              { name: "ΟΠΣΥΔ", slug: "opsyd", desc: "Αναπληρωτές & πίνακες" },
              { name: "Μεταπτυχιακά", slug: "metaptyxiaka", desc: "Προγράμματα σπουδών" },
              { name: "Πιστοποιήσεις", slug: "pistopoihseis", desc: "ECDL, γλώσσες & άλλα" },
            ].map((cat, idx) => (
              <AnimatedSection key={cat.slug} delay={idx * 0.08}>
                <Link to={`/${cat.slug}`} className="block p-6 rounded-2xl group transition-all duration-200 hover:-translate-y-1" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: D.accentSoft }}>
                      <span className="type-ui-label" style={{ color: D.accentStrong, fontSize: "1rem" }}>{cat.name.charAt(0)}</span>
                    </div>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: D.accent }} />
                  </div>
                  <h3 className="type-display-card mb-1" style={{ color: D.ink, fontSize: "1rem" }}>{cat.name}</h3>
                  <p className="text-xs" style={{ color: D.inkSoft }}>{cat.desc}</p>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24" style={{ borderTop: `1px solid ${D.border}`, background: D.ink }}>
        <div className="max-w-4xl mx-auto pt-20 text-center">
          <AnimatedSection>
            <h2 className="type-display-section mb-6" style={{ lineHeight: 1.1, color: "#fff" }}>
              Μείνετε ενημερωμένοι με το Delta
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              Ανακαλύψτε οδηγούς, νέα και αναλύσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις.
            </p>
            <Link to="/blog" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl transition-all hover:opacity-90" style={{ background: D.accent, color: D.ink, fontWeight: 700, fontSize: "1rem" }}>
              Περιηγηθείτε στο Blog <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
