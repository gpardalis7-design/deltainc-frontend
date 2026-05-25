import type { CSSProperties } from "react";
import { Link } from "react-router";
import type { BlogPost } from "../../lib/types";
import { D } from "../../Root";
import { getArticlePrimaryLabel } from "../../lib/articleLabels";
import { isGuideArticle } from "../../lib/articleGuide";
import { trackEvent, getCurrentPageAnalyticsContext } from "../../lib/analytics";
import { ArticleLabelChip } from "./ArticleLabelChip";
import { ArticleCardFooter } from "./ArticleCardFooter";
import { getArticleCardImage } from "./articleImage";

type StackedArticleCardProps = {
  post: BlogPost;
  dateLabel: string;
  imageHeight: string;
  contentClassName?: string;
  showChip?: boolean;
  footerMode?: "published" | "read";
  footerBordered?: boolean;
  footerCalendar?: boolean;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  excerptClassName?: string;
  excerptStyle?: CSSProperties;
};

export function StackedArticleCard({
  post,
  dateLabel,
  imageHeight,
  contentClassName = "p-5",
  showChip = true,
  footerMode = "read",
  footerBordered = true,
  footerCalendar = false,
  titleClassName = "",
  titleStyle,
  excerptClassName = "",
  excerptStyle,
}: StackedArticleCardProps) {
  const primaryLabel = getArticlePrimaryLabel(post);
  const showGuideChip = isGuideArticle(post);
  const image = getArticleCardImage(post.featuredImage, "card");

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="rounded-2xl overflow-hidden group cursor-pointer flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}
      onClick={() =>
        trackEvent("article_card_click", {
          ...getCurrentPageAnalyticsContext(),
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          article_slug: post.slug,
          article_title: post.title,
          article_source_section: "stacked_article_card",
        })
      }
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
    >
      {post.featuredImage && image && (
        <div className="overflow-hidden" style={{ height: imageHeight }}>
          <img src={image.src} alt={post.featuredImage.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className={`${contentClassName} flex flex-col flex-1`}>
        {showChip ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <ArticleLabelChip label={primaryLabel} className="self-start" />
            {showGuideChip ? <ArticleLabelChip label="Οδηγός" className="self-start" /> : null}
          </div>
        ) : null}
        <h3 className={titleClassName} style={titleStyle}>
          {post.title}
        </h3>
        <p className={excerptClassName} style={excerptStyle}>
          {post.excerpt}
        </p>
        <ArticleCardFooter
          dateLabel={dateLabel}
          bordered={footerBordered}
          showCalendarIcon={footerCalendar}
          ctaLabel={footerMode === "read" ? "Διαβάστε" : undefined}
          trailingLabel={footerMode === "published" ? "Δημοσιεύτηκε" : undefined}
        />
      </div>
    </Link>
  );
}
