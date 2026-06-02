import { Link } from "react-router";
import type { BlogPost } from "../../lib/types";
import { D } from "../../Root";
import { trackEvent, getCurrentPageAnalyticsContext } from "../../lib/analytics";
import { getArticleCardImage } from "./articleImage";
import { getArticlePrimaryLabel } from "../../lib/articleLabels";
import { isGuideArticle } from "../../lib/articleGuide";
import { ArticleLabelChip } from "./ArticleLabelChip";

type CompactArticleListItemProps = {
  post: BlogPost;
  dateLabel: string;
  timeLabel?: string;
  to?: string;
  showCategoryLabel?: boolean;
};

export function CompactArticleListItem({
  post,
  dateLabel,
  timeLabel,
  to = `/blog/${post.slug}`,
  showCategoryLabel = false,
}: CompactArticleListItemProps) {
  const image = getArticleCardImage(post.featuredImage, "compact");
  const primaryLabel = getArticlePrimaryLabel(post);
  const showGuideChip = isGuideArticle(post);

  return (
    <Link
      to={to}
      className="group w-full text-left flex gap-3 p-2.5 rounded-xl transition-all duration-200"
      style={{ border: "1px solid transparent", background: "rgba(255,255,255,0.48)", borderRadius: D.radiusInner }}
      onClick={() =>
        trackEvent("related_article_click", {
          ...getCurrentPageAnalyticsContext(),
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          article_slug: post.slug,
          article_title: post.title,
          article_source_section: "compact_article_list_item",
        })
      }
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${D.accent}33`;
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.82)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.48)";
      }}
    >
      {post.featuredImage && image && (
        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden" style={{ borderRadius: D.radiusControl }}>
          <img src={image.src} alt={post.featuredImage.alt} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {showCategoryLabel ? (
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <ArticleLabelChip label={primaryLabel} className="text-[11px]" />
            {showGuideChip ? <ArticleLabelChip label="Οδηγός" className="text-[11px]" /> : null}
          </div>
        ) : null}
        <p className="type-ui-label text-xs line-clamp-2 mb-1" style={{ color: D.ink, lineHeight: 1.35 }}>
          {post.title}
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: D.inkSoft }}>
          <span>{dateLabel}</span>
          {timeLabel ? <span>·</span> : null}
          {timeLabel ? <span>{timeLabel}</span> : null}
        </div>
      </div>
    </Link>
  );
}
