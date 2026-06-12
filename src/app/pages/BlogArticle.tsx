import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { motion, useScroll, useSpring } from "motion/react";
import {
  ArrowLeft, Clock, Calendar, Mail,
  ChevronRight, User, Tag, Facebook,
} from "lucide-react";
import { getPost, getPosts } from "../lib/deltaApi";
import { getArticleContent } from "../lib/mockArticleContent";
import type { BlogPost } from "../lib/types";
import { SeoHead } from "../components/SeoHead";
import { articleSeo } from "../lib/seo";
import { D } from "../Root";
import { usePageNavigation } from "../lib/usePageNavigation";
import { resolveArticleIntent } from "../lib/articleIntent";
import { getArticlePrimaryLabel } from "../lib/articleLabels";
import { isGuideArticle } from "../lib/articleGuide";
import { ArticleLabelChip } from "../components/articles/ArticleLabelChip";
import { getOverlayVisibility, OVERLAY_VISIBILITY_CHANGED_EVENT } from "../lib/uiOverlayState";
import { useNavigation as useSiteNavigation, type FormType } from "../lib/navigationContext";
import { useScrollableRichTables } from "../lib/richContentTables";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";

type ArticleCategory = BlogPost["categories"][number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
}

const HUB_MODAL_FORM_TYPES: Record<string, Exclude<FormType, "general">> = {
  asep: "asep",
  opsyd: "opsyd",
  metaptyxiaka: "metaptyxiaka",
  pistopoihseis: "pistopoihseis",
};

function normalizeServiceModalText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("el-GR");
}

function resolveCategoryServiceFormType(post: BlogPost): FormType | null {
  for (const category of post.categories) {
    const decodedSlug = (() => {
      try {
        return decodeURIComponent(category.slug || "");
      } catch {
        return category.slug || "";
      }
    })();
    const slug = normalizeServiceModalText(decodedSlug);
    const name = normalizeServiceModalText(category.name || "");

    if (slug.includes("asep") || name.includes("ασεπ")) return "asep";
    if (slug.includes("opsyd") || name.includes("οπσυδ")) return "opsyd";
    if (slug.includes("metapty") || name.includes("μεταπτυχ")) return "metaptyxiaka";
    if (slug.includes("pistopoi") || name.includes("πιστοποι")) return "pistopoihseis";
  }

  return null;
}

function resolveServiceModalFormType(post: BlogPost): FormType {
  const hubFormType = post.hub?.slug ? HUB_MODAL_FORM_TYPES[post.hub.slug] : undefined;
  if (hubFormType) return hubFormType;

  return resolveCategoryServiceFormType(post) ?? "general";
}

function isArticleServiceModalBlocked() {
  return getOverlayVisibility("newsletter") || getOverlayVisibility("cookie-consent");
}

function isDisplayableArticleCategory(category: ArticleCategory) {
  const slug = category.slug?.trim().toLowerCase();
  const name = category.name?.trim();
  return Boolean(name) && slug !== "uncategorized";
}

function getUniqueDisplayableCategories(categories: ArticleCategory[]) {
  return categories.reduce<ArticleCategory[]>((acc, category) => {
    if (!isDisplayableArticleCategory(category)) return acc;
    if (acc.some((existing) => existing.id === category.id)) return acc;
    acc.push(category);
    return acc;
  }, []);
}

function dedupePostsBySlug(posts: Array<BlogPost | null | undefined>) {
  return posts.reduce<BlogPost[]>((acc, candidate) => {
    if (!candidate || acc.some((existing) => existing.slug === candidate.slug)) {
      return acc;
    }
    acc.push(candidate);
    return acc;
  }, []);
}

function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: "0%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, ${D.accent}, ${D.accentStrong})`,
        zIndex: 100,
      }}
    />
  );
}

function ArticleSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-36 pb-24 animate-pulse">
      <div className="h-4 w-24 rounded mb-8" style={{ background: "rgba(19,35,58,0.08)" }} />
      <div className="h-12 w-4/5 rounded mb-4" style={{ background: "rgba(19,35,58,0.08)" }} />
      <div className="h-12 w-3/5 rounded mb-8" style={{ background: "rgba(19,35,58,0.06)" }} />
      <div className="h-6 w-full rounded mb-3" style={{ background: "rgba(19,35,58,0.05)" }} />
      <div className="h-6 w-4/5 rounded mb-10" style={{ background: "rgba(19,35,58,0.05)" }} />
      <div className="h-72 rounded-3xl" style={{ background: "rgba(19,35,58,0.07)" }} />
    </div>
  );
}

const proseStyles = `
  .article-body { max-width: 100%; }
  .article-body > * { max-width: 100%; }
  .article-body p { font-family: var(--font-body); margin-bottom: 1.4rem; line-height: 1.85; color: ${D.inkSoft}; font-size: 1.0625rem; }
  .article-body > p:first-of-type::first-letter {
    float: left;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 3.85rem;
    line-height: 0.82;
    font-weight: 700;
    margin-right: 0.42rem;
    margin-top: 0.1rem;
    color: ${D.ink};
    letter-spacing: -0.03em;
  }
  .article-body p.standfirst { font-family: var(--font-body); font-size: 1.2rem; line-height: 1.7; color: ${D.ink}; margin-bottom: 2rem; font-weight: 500; }
  .article-body h2 { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.025em; color: ${D.accentStrong}; margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.25; }
  .article-body h3 { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 1.1rem; letter-spacing: -0.015em; color: ${D.accentStrong}; margin-top: 1.75rem; margin-bottom: 0.6rem; line-height: 1.3; }
  .article-body h4 { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 1rem; letter-spacing: -0.01em; color: ${D.accentStrong}; margin-top: 1.4rem; margin-bottom: 0.5rem; line-height: 1.35; }
  .article-body ul, .article-body ol { margin-bottom: 1.4rem; padding-left: 0; list-style: none; }
  .article-body ul li, .article-body ol li { font-family: var(--font-body); position: relative; padding-left: 1.5rem; margin-bottom: 0.55rem; line-height: 1.7; color: ${D.inkSoft}; font-size: 1.0125rem; }
  .article-body ul li::before { content: '·'; position: absolute; left: 0.4rem; color: ${D.accent}; font-size: 1.4rem; line-height: 1.1; }
  .article-body ol { counter-reset: list-counter; }
  .article-body ol li { counter-increment: list-counter; }
  .article-body ol li::before { content: counter(list-counter) '.'; position: absolute; left: 0; color: ${D.accent}; font-weight: 700; font-size: 0.85rem; top: 0.2rem; }
  .article-body strong { color: ${D.ink}; font-weight: 700; }
  .article-body em { color: ${D.inkSoft}; font-style: italic; }
  .article-body blockquote { font-family: var(--font-body); border-left: 3px solid ${D.accent}; padding: 0.75rem 1.25rem; margin: 2rem 0; background: ${D.accentSoft}; border-radius: 0 0.75rem 0.75rem 0; font-size: 1.0625rem; line-height: 1.7; color: ${D.ink}; font-style: italic; }
  .article-body .callout { font-family: var(--font-body); background: ${D.surface}; border: 1px solid rgba(197,141,42,0.25); border-radius: 0.875rem; padding: 1rem 1.25rem; margin: 1.75rem 0; font-size: 0.9375rem; line-height: 1.6; color: ${D.ink}; }
  .article-body a { color: ${D.accent}; text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; word-break: break-word; }
  .article-body img,
  .article-body video,
  .article-body iframe,
  .article-body canvas,
  .article-body svg {
    max-width: 100%;
    height: auto;
  }
  .article-body .TyagGW_tableContainer,
  .article-body .TyagGW_tableWrapper,
  .article-body .rich-table-scroll,
  .article-body .wp-block-table,
  .article-body figure:has(table) {
    width: 100%;
    overflow-x: auto;
    margin: 1.35rem 0 2rem;
    -webkit-overflow-scrolling: touch;
  }
  .article-body table {
    width: 100%;
    min-width: 36rem;
    border-collapse: separate;
    border-spacing: 0;
    background: ${D.surfaceStrong};
    border: 1px solid ${D.border};
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.05);
  }
  .article-body table caption {
    caption-side: bottom;
    padding-top: 0.75rem;
    color: ${D.inkSoft};
    font-size: 0.85rem;
    line-height: 1.5;
    text-align: left;
  }
  .article-body thead th,
  .article-body table tr:first-child th,
  .article-body table tr:first-child td {
    background: rgba(29, 78, 216, 0.06);
    color: ${D.ink};
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.95rem 1rem;
    text-align: left;
    border-bottom: 1px solid ${D.border};
  }
  .article-body tbody td,
  .article-body tbody th {
    padding: 0.9rem 1rem;
    vertical-align: top;
    border-bottom: 1px solid ${D.border};
    color: ${D.inkSoft};
    font-size: 0.98rem;
    line-height: 1.6;
    text-align: left;
    background: rgba(255,255,255,0.88);
  }
  .article-body tbody tr:last-child td,
  .article-body tbody tr:last-child th {
    border-bottom: 0;
  }
  .article-body table th:first-child,
  .article-body table td:first-child {
    width: 28%;
    min-width: 11rem;
    font-weight: 700;
    color: ${D.ink};
    background: rgba(248, 250, 255, 0.92);
  }
  .article-body pre,
  .article-body .wp-block-preformatted {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    margin: 1.75rem 0 2rem;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    background: ${D.surfaceStrong};
    border: 1px solid ${D.border};
    color: ${D.ink};
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.05);
  }
  @media (max-width: 768px) {
    .article-body > p:first-of-type::first-letter {
      font-size: 3.1rem;
      margin-right: 0.32rem;
      margin-top: 0.08rem;
    }
    .article-body .TyagGW_tableContainer,
    .article-body .TyagGW_tableWrapper,
    .article-body .rich-table-scroll,
    .article-body .wp-block-table,
    .article-body figure:has(table),
    .article-body pre,
    .article-body .wp-block-preformatted {
      margin-left: 0;
      margin-right: 0;
    }
    .article-body table {
      min-width: 32rem;
    }
    .article-body thead th,
    .article-body table tr:first-child th,
    .article-body table tr:first-child td,
    .article-body tbody td,
    .article-body tbody th {
      padding: 0.8rem 0.85rem;
    }
  }
`;

function SocialShareButtons({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : post.url;
  const shareTitle = encodeURIComponent(post.title);
  const buttonClass = compact
    ? "flex items-center justify-center w-9 h-9 rounded-full text-xs transition-all hover:opacity-80"
    : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Κοινοποίηση στο Facebook"
        style={{ background: "#1877F2", color: "#fff", fontWeight: 600 }}
      >
        <Facebook size={13} />
        {!compact && "Facebook"}
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Κοινοποίηση στο X"
        style={{ background: "#000", color: "#fff", fontWeight: 600 }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        {!compact && "X"}
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Κοινοποίηση στο LinkedIn"
        style={{ background: "#0A66C2", color: "#fff", fontWeight: 600 }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        {!compact && "LinkedIn"}
      </a>
      <a
        href={`mailto:?subject=${shareTitle}&body=${encodeURIComponent(shareUrl)}`}
        className={buttonClass}
        aria-label="Κοινοποίηση με email"
        style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.inkSoft, fontWeight: 600 }}
      >
        <Mail size={13} />
        {!compact && "Email"}
      </a>
    </div>
  );
}

function GooglePreferredSourceButton() {
  return (
    <a
      href="https://www.google.com/preferences/source?q=deltainc.gr"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95"
      style={{
        background: "#fff",
        border: `1px solid ${D.border}`,
        boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
        color: D.ink,
      }}
      aria-label="Προσθήκη της Delta στις προτιμήσεις Google"
    >
      <span
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: "2rem", height: "2rem", background: "rgba(255,255,255,0.98)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.05 3.04l3.32 2.57c1.94-1.79 3.06-4.42 3.06-7.55 0-.71-.06-1.39-.19-2.05H12z" />
          <path fill="#34A853" d="M12 22c2.76 0 5.08-.91 6.77-2.47l-3.32-2.57c-.92.62-2.1.99-3.45.99-2.65 0-4.89-1.79-5.69-4.19H2.88v2.63A10.22 10.22 0 0 0 12 22z" />
          <path fill="#4A90E2" d="M6.31 13.76A6.12 6.12 0 0 1 6 12c0-.61.11-1.2.31-1.76V7.61H2.88A10.22 10.22 0 0 0 1.8 12c0 1.65.4 3.2 1.08 4.39l3.43-2.63z" />
          <path fill="#FBBC05" d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.07 3.01 14.76 2 12 2 7.96 2 4.46 4.31 2.88 7.61l3.43 2.63c.8-2.4 3.04-4.19 5.69-4.19z" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: D.inkSoft, fontWeight: 700 }}>
          Google
        </span>
        <span className="text-sm" style={{ color: D.ink, fontWeight: 700 }}>
          Προσθήκη της Delta στις προτιμήσεις Google
        </span>
      </span>
    </a>
  );
}

function RecentArticlesWidget({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="px-1">
      <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${D.border}` }}>
        <h3 className="type-eyebrow" style={{ color: D.ink, letterSpacing: "0.14em" }}>
          Τελευταία άρθρα
        </h3>
      </div>

      <div className="flex flex-col">
        {posts.slice(0, 3).map((post, index) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group block py-4 transition-opacity hover:opacity-90"
            style={{
              borderTop: index === 0 ? "none" : `1px solid ${D.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              {post.featuredImage ? (
                <div className="shrink-0 w-[5.25rem] h-[4rem] rounded-2xl overflow-hidden" style={{ background: D.surface }}>
                  <img
                    src={post.featuredImage.url}
                    alt={post.featuredImage.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <p
                  className="mb-2"
                  style={{
                    color: D.ink,
                    fontWeight: 750,
                    fontSize: "1rem",
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {post.title}
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: D.inkSoft }}>
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>·</span>
                  <span>{formatTime(post.publishedAt)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelevantArticlesSection({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  const [leadPost, ...supportingPosts] = posts;
  const leadLabel = getArticlePrimaryLabel(leadPost);
  const leadGuide = isGuideArticle(leadPost);
  const leadImage = leadPost.featuredImage;

  return (
    <section
      className="px-6 py-16 md:py-20"
      style={{
        borderTop: `1px solid ${D.border}`,
        background: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, ${D.bg} 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 md:mb-12">
          <div className="type-eyebrow mb-2" style={{ color: D.inkSoft, letterSpacing: "0.14em" }}>
            Σχετικό περιεχόμενο
          </div>
          <h2 className="type-display-section" style={{ fontSize: "clamp(1.25rem, 2.4vw, 1.65rem)", color: D.ink }}>
            Συνεχίστε με σχετικά άρθρα
          </h2>
          <p className="text-sm max-w-2xl mt-3" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
            Διαβάστε το επόμενο πιο σχετικό άρθρο και συνεχίστε με επιλεγμένες αναγνώσεις πάνω στο ίδιο θέμα.
          </p>
        </div>

        <div className={supportingPosts.length > 0 ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] gap-10 lg:gap-12 items-start" : ""}>
          <Link
            to={`/blog/${leadPost.slug}`}
            className="group block"
            style={{ borderBottom: `1px solid ${D.border}` }}
          >
            {leadImage ? (
              <div className="mb-5 overflow-hidden rounded-[1.75rem]" style={{ aspectRatio: "16 / 9", background: D.surface }}>
                <img
                  src={leadImage.url}
                  alt={leadImage.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="type-eyebrow" style={{ color: D.inkSoft }}>
                Κύρια συνέχεια
              </span>
              {leadLabel ? <ArticleLabelChip label={leadLabel} className="text-[11px]" /> : null}
              {leadGuide ? <ArticleLabelChip label="Οδηγός" className="text-[11px]" /> : null}
            </div>

            <h3
              className="mb-4"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                color: D.ink,
                fontWeight: 800,
              }}
            >
              {leadPost.title}
            </h3>

            <p className="text-[0.98rem] mb-6" style={{ color: D.inkSoft, lineHeight: 1.8, maxWidth: "58ch" }}>
              {leadPost.excerpt}
            </p>

            <div
              className="flex items-center justify-between gap-4 pb-5 text-sm"
              style={{ color: D.inkSoft }}
            >
              <span>{formatDate(leadPost.publishedAt)}</span>
              <span className="inline-flex items-center gap-2" style={{ color: D.accentStrong, fontWeight: 700 }}>
                Διαβάστε το άρθρο
                <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

            {supportingPosts.length > 0 ? (
            <div className="flex flex-col">
              <div className="type-eyebrow mb-5" style={{ color: D.inkSoft }}>
                Περισσότερες αναγνώσεις
              </div>
              <div className="flex flex-col">
                {supportingPosts.slice(0, 4).map((candidate, index) => {
                  const candidateLabel = getArticlePrimaryLabel(candidate);
                  const candidateGuide = isGuideArticle(candidate);

                  return (
                    <Link
                      key={candidate.id}
                      to={`/blog/${candidate.slug}`}
                      className="group block py-5 transition-opacity hover:opacity-92"
                      style={{
                        borderTop: index === 0 ? `1px solid ${D.border}` : "none",
                        borderBottom: `1px solid ${D.border}`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {candidate.featuredImage ? (
                          <div className="hidden sm:block shrink-0 w-28 h-20 rounded-2xl overflow-hidden" style={{ background: D.surface }}>
                            <img
                              src={candidate.featuredImage.url}
                              alt={candidate.featuredImage.alt}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            {candidateLabel ? <ArticleLabelChip label={candidateLabel} className="text-[10px] opacity-85" /> : null}
                            {candidateGuide ? <ArticleLabelChip label="Οδηγός" className="text-[10px] opacity-85" /> : null}
                          </div>
                          <h4
                            className="mb-2"
                            style={{
                              color: D.ink,
                              fontWeight: 750,
                              fontSize: "1.05rem",
                              lineHeight: 1.3,
                              letterSpacing: "-0.02em",
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            {candidate.title}
                          </h4>
                          <p className="text-sm mb-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                            {candidate.excerpt}
                          </p>
                          <div className="flex items-center justify-between gap-3 text-xs" style={{ color: D.inkSoft }}>
                            <span>{formatDate(candidate.publishedAt)}</span>
                            <span className="inline-flex items-center gap-1.5" style={{ color: D.ink, fontWeight: 700 }}>
                              Διαβάστε
                              <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [postIsMock, setPostIsMock] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [guidePosts, setGuidePosts] = useState<BlogPost[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
  const [curatedNextPost, setCuratedNextPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceUnavailable, setSourceUnavailable] = useState(false);
  const [isArticleReadyForModal, setIsArticleReadyForModal] = useState(false);
  const [hasMetReadTime, setHasMetReadTime] = useState(false);
  const [hasMetScrollDepth, setHasMetScrollDepth] = useState(false);
  const [isBlockingOverlayVisible, setIsBlockingOverlayVisible] = useState(false);
  const { openModalFor, isModalOpen } = useSiteNavigation();
  const autoModalOpenedRef = useRef(false);

  usePageNavigation({
    mode: "content",
    cta: { text: "Περισσότερα Άρθρα", link: "/blog" },
    showStickyBottom: false,
  });

  useEffect(() => {
    if (!slug) return;

    let isCurrent = true;
    setLoading(true);
    setPost(null);
    setPostIsMock(false);
    setSourceUnavailable(false);
    window.scrollTo(0, 0);
    setRelatedPosts([]);
    setGuidePosts([]);
    setLatestPosts([]);
    setCuratedNextPost(null);
    setIsArticleReadyForModal(false);
    setHasMetReadTime(false);
    setHasMetScrollDepth(false);
    autoModalOpenedRef.current = false;

    getPost(slug).then(({ data, isMock, sourceUnavailable: unavailable }) => {
      if (!isCurrent) return;

      setPost(data);
      setPostIsMock(isMock);
      setSourceUnavailable(unavailable);
      setLoading(false);
      setIsArticleReadyForModal(Boolean(data));

      if (data) {
        if (data.nextArticleSlug && data.nextArticleSlug !== slug) {
          getPost(data.nextArticleSlug).then(({ data: curatedPost }) => {
            if (!isCurrent) return;
            if (curatedPost && curatedPost.slug !== slug) {
              setCuratedNextPost(curatedPost);
            }
          });
        }

        if (data.hub?.slug) {
          getPosts({ hub: data.hub.slug }).then(({ data: rel }) => {
            if (!isCurrent) return;
            setRelatedPosts(rel.filter((p) => p.slug !== slug));
          });
        } else {
          const primaryCategory = data.categories[0];
          if (primaryCategory?.id) {
            getPosts({ wpCategoryId: primaryCategory.id }).then(({ data: rel }) => {
              if (!isCurrent) return;
              setRelatedPosts(rel.filter((p) => p.slug !== slug));
            });
          }
        }

        getPosts({}).then(({ data: allPosts }) => {
          if (!isCurrent) return;
          setLatestPosts(allPosts.filter((p) => p.slug !== slug));
          const guides = allPosts.filter((p) => isGuideArticle(p));
          setGuidePosts(guides.filter((p) => p.slug !== slug));
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [slug]);

  const intent = post ? resolveArticleIntent(post) : "read_more";
  const serviceModalFormType = post && intent === "service" ? resolveServiceModalFormType(post) : null;
  const isCurrentArticleResolved = post?.slug === slug;
  const modalSessionKey = serviceModalFormType && isArticleReadyForModal && isCurrentArticleResolved
    ? `${slug}:${serviceModalFormType}`
    : null;

  useEffect(() => {
    const syncBlockingOverlayState = () => {
      setIsBlockingOverlayVisible(isArticleServiceModalBlocked());
    };

    syncBlockingOverlayState();
    window.addEventListener(OVERLAY_VISIBILITY_CHANGED_EVENT, syncBlockingOverlayState as EventListener);
    return () => {
      window.removeEventListener(OVERLAY_VISIBILITY_CHANGED_EVENT, syncBlockingOverlayState as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!modalSessionKey) return;

    const timer = window.setTimeout(() => {
      setHasMetReadTime(true);
    }, 12_000);

    return () => window.clearTimeout(timer);
  }, [modalSessionKey]);

  useEffect(() => {
    if (!modalSessionKey || hasMetScrollDepth) return;

    const checkScrollDepth = () => {
      const doc = document.documentElement;
      const scrollableHeight = Math.max(doc.scrollHeight - window.innerHeight, 0);

      if (scrollableHeight === 0 || window.scrollY / scrollableHeight >= 0.7) {
        setHasMetScrollDepth(true);
      }
    };

    window.addEventListener("scroll", checkScrollDepth, { passive: true });

    return () => {
      window.removeEventListener("scroll", checkScrollDepth);
    };
  }, [modalSessionKey, hasMetScrollDepth]);

  useEffect(() => {
    if (!modalSessionKey || autoModalOpenedRef.current || !hasMetReadTime || !hasMetScrollDepth) return;
    if (isBlockingOverlayVisible || isModalOpen) return;

    autoModalOpenedRef.current = true;
    openModalFor(serviceModalFormType);
  }, [
    modalSessionKey,
    serviceModalFormType,
    hasMetReadTime,
    hasMetScrollDepth,
    isBlockingOverlayVisible,
    isModalOpen,
    openModalFor,
  ]);

  const articleBodyRef = useRef<HTMLDivElement | null>(null);
  const richContent = post?.contentHtml?.trim()
    ? post.contentHtml
    : post && postIsMock
      ? getArticleContent(post.slug, post.excerpt)
      : "";
  const sanitizedRichContent = useMemo(() => sanitizeRichHtml(richContent), [richContent]);
  useScrollableRichTables(articleBodyRef, [post?.id, sanitizedRichContent]);

  if (loading) return <ArticleSkeleton />;
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: D.bg }}>
        <p style={{ color: D.inkSoft }}>
          {sourceUnavailable ? "Δεν ήταν δυνατή η φόρτωση του άρθρου." : "Το άρθρο δεν βρέθηκε."}
        </p>
        <Link to="/blog" className="text-sm" style={{ color: D.accent }}>← Επιστροφή στο Blog</Link>
      </div>
    );
  }

  const seo = articleSeo(post);
  const primaryLabel = getArticlePrimaryLabel(post);
  const validCategories = getUniqueDisplayableCategories(post.categories);
  const primaryCategory = (post.hub?.wpCategoryId
    ? validCategories.find((category) => category.id === post.hub?.wpCategoryId)
    : null) ?? validCategories[0] ?? null;
  const destinationName = post.hub?.name || primaryCategory?.name || "Blog";
  const hubPath = post.hub
    ? `/${post.hub.slug}`
    : primaryCategory?.slug
      ? `/${primaryCategory.slug}`
      : "/blog";
  const breadcrumbLabel = destinationName === "Blog" ? null : destinationName;
  const matchesPrimaryContext = (candidate: BlogPost) => {
    if (post.hub?.slug) {
      const sameHub = candidate.hub?.slug === post.hub.slug;
      const samePrimaryCategory = primaryCategory
        ? candidate.categories.some((category) => category.id === primaryCategory.id)
        : false;
      return sameHub || samePrimaryCategory;
    }

    if (primaryCategory?.id) {
      return candidate.categories.some((category) => category.id === primaryCategory.id);
    }

    return false;
  };

  const filteredRelatedPosts = relatedPosts.filter((candidate) => candidate.slug !== curatedNextPost?.slug);
  const sameContextRelatedPosts = filteredRelatedPosts.filter(matchesPrimaryContext);
  const sameContextGuide = guidePosts.find((candidate) => matchesPrimaryContext(candidate)) || null;
  const candidatePool = dedupePostsBySlug([
    curatedNextPost,
    ...relatedPosts,
    ...guidePosts,
    ...latestPosts,
  ]).filter((candidate) => candidate.slug !== post.slug);
  const primaryLeadCandidates = dedupePostsBySlug([
    curatedNextPost && matchesPrimaryContext(curatedNextPost) ? curatedNextPost : null,
    ...sameContextRelatedPosts,
    sameContextGuide,
    ...candidatePool.filter((candidate) => matchesPrimaryContext(candidate)),
  ]);
  const leadRelevantPost = primaryLeadCandidates[0] ?? curatedNextPost ?? candidatePool[0] ?? null;
  const remainingRelevantCandidates = candidatePool.filter((candidate) => candidate.slug !== leadRelevantPost?.slug);
  const supportingRelevantPosts = (() => {
    const maxSupportingPosts = 4;
    const usedSlugs = new Set<string>();
    const picks: BlogPost[] = [];

    const addPost = (candidate: BlogPost | null | undefined) => {
      if (!candidate || usedSlugs.has(candidate.slug) || candidate.slug === post.slug) return false;
      usedSlugs.add(candidate.slug);
      picks.push(candidate);
      return true;
    };

    if (validCategories.length === 0) {
      for (const candidate of dedupePostsBySlug([
        ...sameContextRelatedPosts.filter((candidate) => candidate.slug !== leadRelevantPost?.slug),
        sameContextGuide?.slug !== leadRelevantPost?.slug ? sameContextGuide : null,
        ...remainingRelevantCandidates,
      ])) {
        addPost(candidate);
        if (picks.length >= maxSupportingPosts) break;
      }

      return picks;
    }

    const categoryBuckets = validCategories.map((category) => ({
      category,
      posts: remainingRelevantCandidates.filter((candidate) =>
        candidate.categories.some((candidateCategory) => candidateCategory.id === category.id),
      ),
    }));

    if (categoryBuckets.length === 1) {
      for (const candidate of categoryBuckets[0].posts) {
        addPost(candidate);
        if (picks.length >= maxSupportingPosts) break;
      }
    } else {
      const targetPerBucket = Math.floor(maxSupportingPosts / categoryBuckets.length);

      for (const bucket of categoryBuckets) {
        let bucketPicks = 0;

        for (const candidate of bucket.posts) {
          if (bucketPicks >= targetPerBucket) break;
          if (addPost(candidate)) {
            bucketPicks += 1;
          }
        }
      }

      for (const bucket of categoryBuckets) {
        for (const candidate of bucket.posts) {
          if (picks.length >= maxSupportingPosts) break;
          addPost(candidate);
        }
      }
    }

    return picks;
  })();
  const relevantPosts = leadRelevantPost ? [leadRelevantPost, ...supportingRelevantPosts] : [];
  const relevantSlugs = new Set(relevantPosts.map((candidate) => candidate.slug));
  const latestDiscoveryPosts = latestPosts.filter((candidate) => {
    if (candidate.slug === post.slug) return false;
    if (relevantSlugs.has(candidate.slug)) return false;
    if (matchesPrimaryContext(candidate)) return false;
    return true;
  }).slice(0, 3);

  return (
    <div style={{ background: D.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{proseStyles}</style>
      <SeoHead seo={seo} />
      <ProgressBar />

      <div className="pt-24 pb-6 md:pb-10" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 86%)` }}>
        <div className="max-w-6xl mx-auto px-6 pt-6 md:pt-8">
          {post.featuredImage ? (
            <div className="relative lg:min-h-[34rem]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[2rem] overflow-hidden shadow-[0_20px_56px_rgba(15,23,42,0.12)] lg:w-[68%]"
                style={{ height: "clamp(320px, 60vw, 540px)", background: "linear-gradient(180deg, rgba(244,247,252,0.98) 0%, rgba(236,242,249,0.98) 100%)" }}
              >
                <img
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.76, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 mt-4 rounded-[1.75rem] lg:absolute lg:right-0 lg:top-10 lg:mt-0 lg:w-[42%]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.96) 100%)",
                  boxShadow: "0 18px 48px rgba(15,23,42,0.12)",
                  border: `1px solid ${D.border}`,
                }}
              >
                <div className="p-6 md:p-7 lg:px-7 lg:py-6">
                  <div className="flex items-center gap-2 text-xs mb-4" style={{ color: D.inkSoft }}>
                    <Link to="/" style={{ color: D.inkSoft }} className="hover:opacity-80 transition-opacity">Αρχική</Link>
                    <ChevronRight size={12} />
                    <Link to="/blog" style={{ color: D.inkSoft }} className="hover:opacity-80 transition-opacity">Blog</Link>
                    {breadcrumbLabel && (
                      <>
                        <ChevronRight size={12} />
                        <Link to={hubPath} style={{ color: D.accentStrong }} className="hover:opacity-80 transition-opacity">{breadcrumbLabel}</Link>
                      </>
                    )}
                  </div>

                  {primaryLabel && (
                    <div className="mb-3">
                      {post.hub ? (
                        <Link to={hubPath} className="px-3 py-1 rounded-full text-xs inline-flex" style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid ${D.accent}33`, fontWeight: 600 }}>
                          {primaryLabel}
                        </Link>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs inline-flex" style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid ${D.accent}33`, fontWeight: 600 }}>
                          {primaryLabel}
                        </span>
                      )}
                    </div>
                  )}

                  <h1
                    className="type-display-hero mb-4"
                    style={{ fontSize: "clamp(1.8rem, 5.5vw, 2.55rem)", letterSpacing: "-0.035em", lineHeight: 1.08, color: D.accentStrong }}
                  >
                    {post.title}
                  </h1>
                </div>

                <div
                  className="px-6 md:px-7 lg:px-7 py-4 md:py-4"
                  style={{
                    background: `linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(23,37,84,0.96) 100%)`,
                    color: "#fff",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    borderBottomLeftRadius: "1.75rem",
                    borderBottomRightRadius: "1.75rem",
                  }}
                >
                  <div className="flex flex-col items-start gap-3 pb-4 md:flex-row md:items-center md:flex-wrap md:gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <User size={14} style={{ color: "#fff" }} />
                      </div>
                      <span className="text-xs" style={{ color: "#fff", fontWeight: 600 }}>
                        {post.author?.name || "Delta"}
                      </span>
                    </div>

                    <div className="w-px h-7 hidden md:block" style={{ background: "rgba(255,255,255,0.14)" }} />

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
                        <Calendar size={12} />
                        {formatDate(post.publishedAt)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
                        <Clock size={12} />
                        {formatTime(post.publishedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-start">
                    <SocialShareButtons post={post} compact />
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="rounded-[2rem] p-6 md:p-8" style={{ background: D.surfaceStrong, boxShadow: "0 18px 52px rgba(15,23,42,0.08)" }}>
              <div className="flex items-center gap-2 text-xs mb-5" style={{ color: D.inkSoft }}>
                <Link to="/" style={{ color: D.inkSoft }} className="hover:opacity-80 transition-opacity">Αρχική</Link>
                <ChevronRight size={12} />
                <Link to="/blog" style={{ color: D.inkSoft }} className="hover:opacity-80 transition-opacity">Blog</Link>
                {breadcrumbLabel && (
                  <>
                    <ChevronRight size={12} />
                    <Link to={hubPath} style={{ color: D.accentStrong }} className="hover:opacity-80 transition-opacity">{breadcrumbLabel}</Link>
                  </>
                )}
              </div>

              {primaryLabel && (
                <div className="mb-4">
                  {post.hub ? (
                    <Link to={hubPath} className="px-3 py-1 rounded-full text-xs inline-flex" style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid ${D.accent}33`, fontWeight: 600 }}>
                      {primaryLabel}
                    </Link>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs inline-flex" style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid ${D.accent}33`, fontWeight: 600 }}>
                      {primaryLabel}
                    </span>
                  )}
                </div>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="type-display-hero mb-6 md:mb-8"
                style={{ fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)", letterSpacing: "-0.035em", lineHeight: 1.1, color: D.accentStrong, maxWidth: "900px" }}
              >
                {post.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center flex-wrap gap-4 md:gap-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: D.accentSoft }}>
                    <User size={14} style={{ color: D.accentStrong }} />
                  </div>
                  <span className="text-xs" style={{ color: D.ink, fontWeight: 600 }}>
                    {post.author?.name || "Delta"}
                  </span>
                </div>

                <div className="w-px h-7 hidden md:block" style={{ background: D.borderStrong }} />

                <div className="flex items-center gap-1.5 text-xs" style={{ color: D.inkSoft }}>
                  <Calendar size={12} />
                  {formatDate(post.publishedAt)}
                </div>

                <div className="flex items-center gap-1.5 text-xs" style={{ color: D.inkSoft }}>
                  <Clock size={12} />
                  {formatTime(post.publishedAt)}
                </div>

                <div className="ml-auto hidden md:block">
                  <SocialShareButtons post={post} compact />
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-8 lg:gap-12 items-start">
          <div className="flex-1 min-w-0 py-8 md:py-12">
            <div className="mb-6 md:mb-8">
              <GooglePreferredSourceButton />
            </div>

            {richContent ? (
              <div ref={articleBodyRef} className="article-body" dangerouslySetInnerHTML={{ __html: sanitizedRichContent }} />
            ) : (
              <div
                className="rounded-2xl px-5 py-4 text-sm"
                style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, lineHeight: 1.75 }}
              >
                Το πλήρες περιεχόμενο του άρθρου δεν ήταν διαθέσιμο τη στιγμή της φόρτωσης. Δοκιμάστε ξανά σε λίγο.
              </div>
            )}

            {post.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-8 pt-6" style={{ borderTop: `1px solid ${D.border}` }}>
                <Tag size={13} style={{ color: D.inkSoft }} />
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/blog?tag=${tag.slug}`}
                    className="px-3 py-1 rounded-full text-xs transition-colors"
                    style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.inkSoft }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = D.accent;
                      (e.currentTarget as HTMLElement).style.color = D.accentStrong;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = D.border;
                      (e.currentTarget as HTMLElement).style.color = D.inkSoft;
                    }}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between flex-wrap gap-4 pt-6" style={{ borderTop: `1px solid ${D.border}` }}>
              <Link
                to="/blog"
                className="flex items-center gap-2 text-sm transition-colors"
                style={{ color: D.inkSoft }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = D.ink)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = D.inkSoft)}
              >
                <ArrowLeft size={14} /> Επιστροφή στο Blog
              </Link>
              <SocialShareButtons post={post} compact />
            </div>
          </div>

          <aside
            className="hidden lg:flex flex-col gap-5 w-80 shrink-0 py-12"
            style={{ position: "sticky", top: "5.5rem", maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}
          >
            <RecentArticlesWidget posts={latestDiscoveryPosts} />
          </aside>
        </div>
      </div>

      <RelevantArticlesSection posts={relevantPosts} />

      {latestDiscoveryPosts.length > 0 && (
        <div className="lg:hidden px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <RecentArticlesWidget posts={latestDiscoveryPosts} />
          </div>
        </div>
      )}
    </div>
  );
}
