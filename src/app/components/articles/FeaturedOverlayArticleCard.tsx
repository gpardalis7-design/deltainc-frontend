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

type FeaturedOverlayArticleCardProps = {
  post: BlogPost;
  dateLabel: string;
  imageHeight: string;
  featuredLabel?: string;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  excerptClassName?: string;
  excerptStyle?: CSSProperties;
  showAuthor?: boolean;
};

export function FeaturedOverlayArticleCard({
  post,
  dateLabel,
  imageHeight,
  featuredLabel = "✦ Προτεινόμενο",
  titleClassName = "",
  titleStyle,
  excerptClassName = "",
  excerptStyle,
  showAuthor = true,
}: FeaturedOverlayArticleCardProps) {
  const primaryLabel = getArticlePrimaryLabel(post);
  const showGuideChip = isGuideArticle(post);
  const image = getArticleCardImage(post.featuredImage, "featured");

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="rounded-3xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1 relative block"
      style={{ border: `1px solid ${D.border}`, boxShadow: `0 4px 20px ${D.shadow}`, borderRadius: D.radiusShell }}
      onClick={() =>
        trackEvent("featured_article_click", {
          ...getCurrentPageAnalyticsContext(),
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          article_slug: post.slug,
          article_title: post.title,
          article_source_section: "featured_overlay_article_card",
        })
      }
    >
      {post.featuredImage && image && (
        <div className="overflow-hidden" style={{ height: imageHeight }}>
          <img src={image.src} alt={post.featuredImage.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(19,35,58,0.9) 0%, rgba(19,35,58,0.2) 60%, transparent 100%)" }} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="flex items-center gap-2 mb-3">
          <ArticleLabelChip label={primaryLabel} />
          {showGuideChip ? <ArticleLabelChip label="Οδηγός" /> : null}
          <span className="px-2.5 py-0.5 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
            {featuredLabel}
          </span>
        </div>
        <h2 className={titleClassName} style={titleStyle}>
          {post.title}
        </h2>
        <p className={excerptClassName} style={excerptStyle}>
          {post.excerpt}
        </p>
        <div className="flex items-center gap-4">
          {showAuthor ? (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{post.author?.name}</span>
          ) : null}
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{dateLabel}</span>
          <span className="ml-auto">
            <ArticleCardFooter bordered={false} dark ctaLabel="Διαβάστε" />
          </span>
        </div>
      </div>
    </Link>
  );
}
