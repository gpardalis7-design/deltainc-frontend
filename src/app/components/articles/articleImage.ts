import type { DeltaMedia } from "../../lib/types";

export type ResponsiveMediaPreference = "compact" | "card" | "featured";

export type ResponsiveMediaResult = {
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
};

export function getResponsiveMedia(
  media: DeltaMedia | null,
  preference: ResponsiveMediaPreference = "card",
): ResponsiveMediaResult | null {
  if (!media) return null;

  const sizes = media.sizes || {};

  const preferred =
    preference === "compact"
      ? sizes.medium || sizes.medium_large || sizes.thumbnail || sizes.large || sizes.full
      : preference === "featured"
        ? sizes.large || sizes.medium_large || sizes.medium || sizes.full
        : sizes.medium_large || sizes.large || sizes.medium || sizes.full;

  const fallback = preferred || media;
  const allowedSizeNames = preference === "compact"
    ? (["thumbnail", "medium", "medium_large", "large", "full"] as const)
    : (["medium", "medium_large", "large", "full"] as const);
  const candidates = [
    ...allowedSizeNames.map((name) => sizes[name]),
    media,
  ].filter((candidate): candidate is NonNullable<typeof candidate> =>
    Boolean(candidate?.url && candidate.width > 0),
  );

  const candidatesByWidth = new Map<number, typeof candidates[number]>();
  for (const candidate of candidates) {
    if (!candidatesByWidth.has(candidate.width)) {
      candidatesByWidth.set(candidate.width, candidate);
    }
  }

  const srcSetCandidates = [...candidatesByWidth.values()].sort((a, b) => a.width - b.width);

  return {
    src: fallback.url,
    srcSet: srcSetCandidates.length > 1
      ? srcSetCandidates.map((candidate) => `${candidate.url} ${candidate.width}w`).join(", ")
      : undefined,
    width: fallback.width || media.width || undefined,
    height: fallback.height || media.height || undefined,
  };
}

export const getArticleCardImage = getResponsiveMedia;
