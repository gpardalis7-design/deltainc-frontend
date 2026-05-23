export type HubVariant = "guided" | "editorial";

export const GUIDED_HUB_SLUGS = [
  "asep",
  "opsyd",
  "metaptyxiaka",
  "pistopoihseis",
] as const;

export function resolveHubVariant(slug: string | undefined): HubVariant {
  if (!slug) return "editorial";
  return (GUIDED_HUB_SLUGS as readonly string[]).includes(slug) ? "guided" : "editorial";
}
