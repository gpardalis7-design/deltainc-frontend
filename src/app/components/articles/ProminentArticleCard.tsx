import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { BlogPost } from "../../lib/types";
import { D } from "../../Root";
import { getArticlePrimaryLabel } from "../../lib/articleLabels";
import { trackEvent, getCurrentPageAnalyticsContext } from "../../lib/analytics";
import { ArticleLabelChip } from "./ArticleLabelChip";
import { ArticleCardFooter } from "./ArticleCardFooter";
import { getArticleCardImage } from "./articleImage";

type ProminentArticleCardProps = {
  post: BlogPost;
  dateLabel: string;
  eyebrow: string;
  ctaLabel?: string;
};

export function ProminentArticleCard({
  post,
  dateLabel,
  eyebrow,
  ctaLabel = "Διαβάστε τον οδηγό",
}: ProminentArticleCardProps) {
  const primaryLabel = getArticlePrimaryLabel(post);
  const image = getArticleCardImage(post.featuredImage, "featured");

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[30px] transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 14px 34px ${D.shadow}` }}
      onClick={() =>
        trackEvent("featured_article_click", {
          ...getCurrentPageAnalyticsContext(),
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          article_slug: post.slug,
          article_title: post.title,
          article_source_section: "prominent_article_card",
        })
      }
    >
      {post.featuredImage && image && (
        <div className="overflow-hidden" style={{ height: "244px" }}>
          <img
            src={image.src}
            alt={post.featuredImage.alt}
            loading="lazy"
            width={image.width}
            height={image.height}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6 md:p-7 flex flex-col flex-1 gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
            {eyebrow}
          </span>
          <ArticleLabelChip label={primaryLabel} className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px]" />
        </div>

        <div>
          <h3 className="type-display-section mb-3" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", color: D.ink, lineHeight: 1.15 }}>
            {post.title}
          </h3>
          <p className="text-sm md:text-[0.95rem]" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
            {post.excerpt}
          </p>
        </div>

        <div className="mt-auto">
          <ArticleCardFooter dateLabel={dateLabel} bordered={false} />
        </div>

        <div className="inline-flex items-center gap-2 text-sm" style={{ color: D.accentStrong, fontWeight: 700 }}>
          {ctaLabel}
          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
