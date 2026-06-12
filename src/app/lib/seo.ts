// ─── SEO utility library ──────────────────────────────────────────────────────
// Adapts the Delta SEO spec for a React/Vite/React-Router SPA.
// All server-rendering caveats are noted; the patterns are identical to what
// generateMetadata would produce in Next.js App Router.
import { shouldIndexHubSlug, shouldIndexStaticPage, type StaticSeoPage } from "./sitePolicy";

export const SITE_URL = "https://deltainc.gr";
export const SITE_NAME = "Delta";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

export type RobotsRule = "index,follow" | "noindex,follow" | "noindex,nofollow";

export interface SeoMeta {
  title: string;
  titleFull?: string; // overrides template (e.g. homepage)
  description: string;
  canonical: string;
  robots?: RobotsRule;
  og?: {
    type?: "website" | "article";
    image?: string;
    imageAlt?: string;
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  jsonLd?: object | object[];
}

// ─── Canonical URL builder ────────────────────────────────────────────────────

export function canonical(path: string): string {
  return `${SITE_URL}${path}`;
}

// ─── Per-page SEO factories ───────────────────────────────────────────────────

export function homeSeo(): SeoMeta {
  return {
    titleFull: "Delta | Εκπαίδευση, ΑΣΕΠ, ΟΠΣΥΔ & Μεταπτυχιακά",
    title: "Delta | Εκπαίδευση, ΑΣΕΠ, ΟΠΣΥΔ & Μεταπτυχιακά",
    description:
      "Ειδήσεις, οδηγοί και ενημερώσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις. Η πλατφόρμα εκπαίδευσης του Delta.",
    canonical: canonical("/"),
    robots: "index,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/blog?search={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/LOGO.png`, width: 200, height: 60 },
        sameAs: ["https://deltainc.gr"],
      },
    ],
  };
}

export function hubSeo(slug: string, filtered = false): SeoMeta {
  const hubs: Record<string, { title: string; description: string }> = {
    opsyd: {
      title: "ΟΠΣΥΔ: Οδηγοί, Πίνακες & Ενημερώσεις 2026 | Delta",
      description:
        "Πλήρης καθοδήγηση για ΟΠΣΥΔ — αίτηση ένταξης, πίνακες αναπληρωτών, δικαιολογητικά και νέες αλλαγές 2026. Όλα όσα χρειάζεται ένας εκπαιδευτικός.",
    },
    asep: {
      title: "ΑΣΕΠ: Προκηρύξεις, Εξετάσεις & Οδηγοί Αίτησης | Delta",
      description:
        "Τρέχουσες προκηρύξεις ΑΣΕΠ, οδηγοί αίτησης βήμα-βήμα, ημερομηνίες εξετάσεων και νέα από το δημόσιο τομέα. Έγκαιρη ενημέρωση.",
    },
    metaptyxiaka: {
      title: "Μεταπτυχιακά Προγράμματα 2026: Αναζήτηση & Οδηγοί | Delta",
      description:
        "Βρείτε και συγκρίνετε μεταπτυχιακά ΑΕΙ σε όλη την Ελλάδα. Δίδακτρα, αιτήσεις, υποτροφίες και επαγγελματικές προοπτικές — όλα σε ένα μέρος.",
    },
    pistopoihseis: {
      title: "Πιστοποιήσεις Εκπαιδευτικών 2026: Οδηγοί & Εξετάσεις | Delta",
      description:
        "Πλήρης καθοδήγηση για πιστοποιήσεις εκπαιδευτικών — ECDL/ICDL, ξένες γλώσσες, ψηφιακές δεξιότητες. Ποιες αναγνωρίζονται από ΑΣΕΠ και ΟΠΣΥΔ.",
    },
  };
  const meta = hubs[slug] || { title: `${slug} | Delta`, description: "" };
  const path = `/${slug}`;
  const shouldIndex = !filtered && shouldIndexHubSlug(slug);
  return {
    title: meta.title,
    description: meta.description,
    canonical: canonical(path),
    robots: shouldIndex ? "index,follow" : "noindex,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: meta.title,
        description: meta.description,
        url: canonical(path),
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Αρχική", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: meta.title.split(":")[0], item: canonical(path) },
          ],
        },
      },
    ],
  };
}

export function blogIndexSeo(filtered = false): SeoMeta {
  return {
    title: "Blog — Εκπαίδευση & ΑΣΕΠ | Delta",
    description:
      "Οδηγοί, αναλύσεις και νέα για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις. Διαβάστε τα τελευταία άρθρα του Delta.",
    canonical: canonical("/blog"),
    // noindex when a ?hub= filter is active — canonical hub pages handle those
    robots: filtered ? "noindex,follow" : "index,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Blog | Delta",
      url: canonical("/blog"),
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Αρχική", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: canonical("/blog") },
        ],
      },
    },
  };
}

export function blogHubSeo(): SeoMeta {
  return {
    title: "Blog Hub | Delta",
    description:
      "Επιλεγμένες διαδρομές περιήγησης και editorial επισημάνσεις από το Delta Blog.",
    canonical: canonical("/blog-hub"),
    robots: "noindex,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
  };
}

export function articleSeo(post: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  featuredImage?: { url: string; alt: string } | null;
  author?: { name: string } | null;
  hub?: { name: string; slug: string } | null;
}): SeoMeta {
  const path = `/blog/${post.slug}`;
  const image = post.featuredImage?.url || DEFAULT_OG_IMAGE;
  const imageAlt = post.featuredImage?.alt || post.title;
  const author = post.author?.name || "Delta Editorial Team";
  const hubName = post.hub?.name;
  const hubSlug = post.hub?.slug;

  const breadcrumbItems: object[] = [
    { "@type": "ListItem", position: 1, name: "Αρχική", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: canonical("/blog") },
  ];
  if (hubSlug && hubName) {
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: hubName, item: canonical(`/${hubSlug}`) });
    breadcrumbItems.push({ "@type": "ListItem", position: 4, name: post.title, item: canonical(path) });
  } else {
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: post.title, item: canonical(path) });
  }

  return {
    title: `${post.title} | Delta`,
    description: post.excerpt.slice(0, 160),
    canonical: canonical(path),
    robots: "index,follow",
    og: {
      type: "article",
      image,
      imageAlt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      author,
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt.slice(0, 160),
        image: { "@type": "ImageObject", url: image, width: 1200, height: 630 },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: { "@type": "Person", name: author },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/LOGO.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical(path) },
        url: canonical(path),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    ],
  };
}

export function programsSeo(filtered = false): SeoMeta {
  return {
    title: "Μεταπτυχιακά & Προγράμματα Σπουδών | Delta",
    description:
      "Αναζητήστε μεταπτυχιακά προγράμματα στην Ελλάδα. Φιλτράρετε κατά πανεπιστήμιο, πόλη, τρόπο φοίτησης και κόστος.",
    canonical: canonical("/courses"),
    robots: filtered ? "noindex,follow" : "index,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Μεταπτυχιακά Προγράμματα | Delta",
      url: canonical("/courses"),
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Αρχική", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Μεταπτυχιακά", item: canonical("/courses") },
        ],
      },
    },
  };
}

export function staticPageSeo(page: Exclude<StaticSeoPage, "blogHub">): SeoMeta {
  const pages = {
    about: {
      title: "Σχετικά με το Delta | Επικοινωνία & Ομάδα",
      description: "Η ομάδα του Delta παρέχει έγκυρη ενημέρωση για εκπαιδευτικά θέματα από το 2018. Επικοινωνήστε μαζί μας.",
      path: "/about",
    },
    contact: {
      title: "Επικοινωνία | Delta Inc",
      description: "Επικοινωνήστε με την ομάδα του Delta για ερωτήσεις σχετικά με ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις. Είμαστε εδώ να σας βοηθήσουμε.",
      path: "/contact",
    },
    privacy: {
      title: "Πολιτική Απορρήτου | Delta Inc",
      description: "Μάθετε πώς η Delta Inc. συλλέγει και επεξεργάζεται προσωπικά δεδομένα μέσω του ιστότοπου, των φορμών επικοινωνίας και των εργαλείων ανάλυσης.",
      path: "/privacy-policy",
    },
    cookies: {
      title: "Πολιτική Cookies | Delta Inc",
      description: "Πληροφορίες για τα cookies, το local storage και τα εργαλεία ανάλυσης που χρησιμοποιεί ο ιστότοπος της Delta Inc.",
      path: "/cookie-policy",
    },
    terms: {
      title: "Όροι Χρήσης | Delta Inc",
      description: "Οι όροι που διέπουν τη χρήση του ιστότοπου της Delta Inc. και του ενημερωτικού περιεχομένου που παρέχεται μέσω αυτού.",
      path: "/terms",
    },
    assignments: {
      title: "Κοστολόγηση Εργασίας | Delta Inc",
      description: "Συμπληρώστε τη φόρμα κοστολόγησης εργασίας με στοιχεία θέματος, ειδικότητας, γλώσσας συγγραφής και προθεσμίας παράδοσης.",
      path: "/assignments",
    },
    deltaApps: {
      title: "Delta Apps | Ψηφιακά Εργαλεία Delta",
      description: "Το Delta Apps είναι η νέα ενότητα ψηφιακών εργαλείων της Delta για σπουδές, εργασία και καθημερινές αποφάσεις, με πρώτο σταθμό το Μόρια Calculator.",
      path: "/delta-apps",
    },
    moriaCalculator: {
      title: "Μόρια Calculator | Delta Apps",
      description: "Υπολογίστε μόρια αναπληρωτών με καθαρό breakdown για ακαδημαϊκά προσόντα, γλώσσες, προϋπηρεσία και κοινωνικά κριτήρια μέσα από το Delta Apps.",
      path: "/delta-apps/moria-calculator",
    },
  };
  const p = pages[page];
  return {
    title: p.title,
    description: p.description,
    canonical: canonical(p.path),
    robots: shouldIndexStaticPage(page) ? "index,follow" : "noindex,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
  };
}

export function notFoundSeo(path = "/"): SeoMeta {
  return {
    title: "Η σελίδα δεν βρέθηκε",
    description:
      "Η σελίδα που αναζητάτε δεν είναι διαθέσιμη. Επιστρέψτε στην αρχική ή συνεχίστε σε μία από τις βασικές ενότητες του Delta.",
    canonical: canonical(path),
    robots: "noindex,follow",
    og: { type: "website", image: DEFAULT_OG_IMAGE },
  };
}
