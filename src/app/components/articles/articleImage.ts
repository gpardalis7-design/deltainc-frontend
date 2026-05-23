import type { DeltaMedia } from "../../lib/types";

export function getArticleCardImage(media: DeltaMedia | null, preference: "compact" | "card" | "featured" = "card") {
  if (!media) return null;

  const sizes = media.sizes || {};

  const preferred =
    preference === "compact"
      ? sizes.medium || sizes.medium_large || sizes.thumbnail || sizes.large || sizes.full
      : preference === "featured"
        ? sizes.large || sizes.medium_large || sizes.medium || sizes.full
        : sizes.medium_large || sizes.large || sizes.medium || sizes.full;

  return preferred
    ? {
        src: preferred.url,
        width: preferred.width || media.width,
        height: preferred.height || media.height,
      }
    : {
        src: media.url,
        width: media.width,
        height: media.height,
      };
}
