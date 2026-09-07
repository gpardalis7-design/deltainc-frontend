export interface SitePromotion {
  id: string;
  enabled: boolean;
  message: string;
  ctaLabel: string;
  href: string;
  logoAlt: string;
  excludedPaths: string[];
}

export const sitePromotion: SitePromotion = {
  id: "dmpa-2800",
  enabled: true,
  message: "Μεταπτυχιακό στη Δημόσια Διοίκηση (DMPA) — Δίδακτρα 2.800€ για περιορισμένες θέσεις.",
  ctaLabel: "Δείτε το πρόγραμμα",
  href: "/courses/metaptyxiako-dimosia-dioikisi-neapolis-distance-learning?utm_source=deltainc&utm_medium=announcement_bar&utm_campaign=dmpa_2800",
  logoAlt: "Neapolis University Pafos",
  excludedPaths: ["/courses/metaptyxiako-dimosia-dioikisi-neapolis-distance-learning"],
};
