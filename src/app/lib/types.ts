// ─── Delta API v1 Types ─────────────────────────────────────────────────────

export interface DeltaMedia {
  id: number;
  url: string;
  alt: string;
  width: number;
  height: number;
  mimeType: string;
  sizes?: Partial<Record<"thumbnail" | "medium" | "medium_large" | "large" | "full", {
    url: string;
    width: number;
    height: number;
    mimeType: string;
  }>>;
}

export interface DeltaSeo {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: DeltaMedia | null;
}

export interface DeltaAuthor {
  id: number;
  name: string;
  slug: string;
  bio: string;
  avatar: DeltaMedia | null;
}

export interface DeltaTaxonomyTerm {
  id: number;
  name: string;
  slug: string;
  url: string;
}

export interface DeltaHub {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  featuredImage: DeltaMedia | null;
  /** WP category ID — populated when fetched from wp/v2/categories */
  wpCategoryId?: number;
  /** Post count from WP — populated when fetched from wp/v2/categories */
  count?: number;
}

// ─── Blog Post ───────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  articleIntent?: "read_more" | "hub" | "service";
  nextArticleSlug?: string;
  isEvergreenGuide?: boolean;
  featuredImage: DeltaMedia | null;
  author: DeltaAuthor | null;
  hub: DeltaHub | null;
  categories: DeltaTaxonomyTerm[];
  tags: DeltaTaxonomyTerm[];
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  isFeatured: boolean;
  seo: DeltaSeo | null;
  relatedPosts: RelatedPost[];
}

export interface RelatedPost {
  id: number;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  featuredImage: DeltaMedia | null;
  publishedAt: string;
}

// ─── Program ─────────────────────────────────────────────────────────────────

export interface ProgramSummary {
  level: string;
  category: string;
  university: string;
  mode: string;
  city: string;
  uniType: string;
  tuition: string;
  duration: string;
  language: string;
  deadline: string;
  format: string;
}

export interface ProgramTaxonomies {
  level: DeltaTaxonomyTerm[];
  category: DeltaTaxonomyTerm[];
  university: DeltaTaxonomyTerm[];
  mode: DeltaTaxonomyTerm[];
  city: DeltaTaxonomyTerm[];
  uniType: DeltaTaxonomyTerm[];
}

export interface Program {
  id: number;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  featuredImage: DeltaMedia | null;
  summary: ProgramSummary;
  taxonomies: ProgramTaxonomies;
  sections: {
    overview: string;
    curriculum: string;
    admissions: string;
    outcomes: string;
    faq: string;
  };
  hub: DeltaHub | null;
  isFeatured: boolean;
  publishedAt: string;
  updatedAt: string;
  seo: DeltaSeo | null;
}

// ─── Homepage ────────────────────────────────────────────────────────────────

export interface HomepagePayload {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: { label: string; url: string };
    secondaryCta: { label: string; url: string };
    backgroundImage: DeltaMedia | null;
  };
  latestPosts: BlogPost[];
  featuredPrograms: Program[];
  trendingTopics: string[];
  stats: {
    students: string;
    programs: string;
    universities: string;
    successRate: string;
  };
  testimonials: {
    id: number;
    name: string;
    role: string;
    avatar: DeltaMedia | null;
    content: string;
    rating: number;
  }[];
  contactBlock: { title: string; description: string };
  seo: DeltaSeo | null;
}

// ─── API Response wrappers ───────────────────────────────────────────────────

export interface CollectionResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  filters?: Record<string, { label: string; value: string }[]>;
}

export interface SingleResponse<T> {
  data: T;
}

export interface FilterOptions {
  level: { label: string; value: string }[];
  category: { label: string; value: string }[];
  university: { label: string; value: string }[];
  mode: { label: string; value: string }[];
  city: { label: string; value: string }[];
  uni_type: { label: string; value: string }[];
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  url: string;
}

export interface Navigation {
  header: NavItem[];
  footer: NavItem[];
}

// ─── Query Params ────────────────────────────────────────────────────────────

export interface PostsParams {
  page?: number;
  perPage?: number;
  /** Fetch from a precise position; useful when first page has a featured item. */
  offset?: number;
  hub?: string;
  /** Pass a resolved WP category ID directly to skip slug→ID resolution */
  wpCategoryId?: number;
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  sort?: string;
}

export interface ProgramsParams {
  page?: number;
  q?: string;
  level?: string;
  category?: string;
  university?: string;
  mode?: string;
  city?: string;
  uni_type?: string;
  tuition_min?: string;
  tuition_max?: string;
  featured?: boolean;
  hub?: string;
  sort?: string;
}
