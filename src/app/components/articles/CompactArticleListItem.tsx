import { Link } from "react-router";
import type { BlogPost } from "../../lib/types";
import { D } from "../../Root";
import { trackEvent, getCurrentPageAnalyticsContext } from "../../lib/analytics";
import { getArticleCardImage } from "./articleImage";

type CompactArticleListItemProps = {
  post: BlogPost;
  dateLabel: string;
  timeLabel?: string;
  to?: string;
};

export function CompactArticleListItem({
  post,
  dateLabel,
  timeLabel,
  to = `/blog/${post.slug}`,
}: CompactArticleListItemProps) {
  const image = getArticleCardImage(post.featuredImage, "compact");

  return (
    <Link
      to={to}
      className="group w-full text-left flex gap-3 p-2.5 rounded-xl transition-all duration-200"
      style={{ border: "1px solid transparent", background: "rgba(255,255,255,0.48)" }}
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
        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden">
          <img src={image.src} alt={post.featuredImage.alt} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
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
