import { Helmet } from "react-helmet-async";
import type { SeoMeta } from "../lib/seo";
import {
  ALLOW_INDEXING,
  DEFAULT_OG_IMAGE,
  PUBLIC_SITE_URL,
  SITE_NAME,
} from "../lib/seo";

interface SeoHeadProps {
  seo: SeoMeta;
}

export function SeoHead({ seo }: SeoHeadProps) {
  const titleFull = seo.titleFull ?? `${seo.title} | ${SITE_NAME}`;
  const ogImage = seo.og?.image || DEFAULT_OG_IMAGE;
  const ogType = seo.og?.type || "website";
  const requestedRobots =
    seo.robots || "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const robots = ALLOW_INDEXING ? requestedRobots : requestedRobots.replace(/^index/, "noindex");
  const canonicalPath = (() => {
    try {
      return new URL(seo.canonical).pathname;
    } catch {
      return "/";
    }
  })();
  const ogUrl = seo.og?.url || `${PUBLIC_SITE_URL}${canonicalPath}`;
  const imageWidth = seo.og?.imageWidth || (ogImage === DEFAULT_OG_IMAGE ? 1200 : undefined);
  const imageHeight = seo.og?.imageHeight || (ogImage === DEFAULT_OG_IMAGE ? 630 : undefined);

  const jsonLdItems = seo.jsonLd
    ? Array.isArray(seo.jsonLd)
      ? seo.jsonLd
      : [seo.jsonLd]
    : [];

  return (
    <Helmet>
      {/* Core */}
      <html lang="el" />
      <title>{titleFull}</title>
      {seo.description ? <meta name="description" content={seo.description} /> : null}
      <link rel="canonical" href={seo.canonical} />
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={seo.og?.type === "article" ? seo.title : titleFull} />
      {seo.description ? <meta property="og:description" content={seo.description} /> : null}
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={seo.og?.imageAlt || seo.title} />
      {imageWidth ? <meta property="og:image:width" content={String(imageWidth)} /> : null}
      {imageHeight ? <meta property="og:image:height" content={String(imageHeight)} /> : null}
      <meta property="og:locale" content="el_GR" />
      {seo.og?.publishedTime && (
        <meta property="article:published_time" content={seo.og.publishedTime} />
      )}
      {seo.og?.modifiedTime && (
        <meta property="article:modified_time" content={seo.og.modifiedTime} />
      )}
      {seo.og?.author && (
        <meta property="article:author" content={seo.og.author} />
      )}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.og?.type === "article" ? seo.title : titleFull} />
      {seo.description ? <meta name="twitter:description" content={seo.description} /> : null}
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={seo.og?.imageAlt || seo.title} />
      <meta name="twitter:site" content="@deltainc_gr" />

      {/* Structured data / JSON-LD */}
      {jsonLdItems.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
