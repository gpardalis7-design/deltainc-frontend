import type { HomepagePayload } from "./types";
import { MOCK_POSTS } from "./mockPosts";
import { MOCK_PROGRAMS } from "./mockPrograms";

const WP_BASE_URL = import.meta.env.VITE_WP_BASE_URL || "https://deltainc.gr";

export const MOCK_HOMEPAGE: HomepagePayload = {
  hero: {
    eyebrow: "Η #1 Πηγή για Εκπαιδευτικές Ειδήσεις",
    title: "Προγράμματα Σπουδών, Προκηρύξεις & Οδηγοί",
    description: "Το Delta είναι η πιο αξιόπιστη πλατφόρμα για εκπαιδευτικές ειδήσεις, μεταπτυχιακά προγράμματα και οδηγούς ΑΣΕΠ, ΟΠΣΥΔ στην Ελλάδα.",
    primaryCta: { label: "Εξερεύνηση Προγραμμάτων", url: "/courses" },
    secondaryCta: { label: "Τελευταίες Ειδήσεις", url: "/blog" },
    backgroundImage: null,
  },
  latestPosts: MOCK_POSTS.slice(0, 3),
  featuredHubPosts: [
    MOCK_POSTS[2],
    MOCK_POSTS[1],
    MOCK_POSTS[0],
    MOCK_POSTS[3],
  ],
  featuredPrograms: MOCK_PROGRAMS.slice(0, 3),
  trendingTopics: ["ΑΣΕΠ 3Κ/2026", "Νέοι Πίνακες ΟΠΣΥΔ", "Μεταπτυχιακά Αθήνα", "Πιστοποιήσεις"],
  stats: {
    students: "12,000+",
    programs: "500+",
    universities: "85+",
    successRate: "92%",
  },
  testimonials: [
    {
      id: 1,
      name: "Μαρία Παπαδοπούλου",
      role: "Εκπαιδευτικός Δημοτικού, Αθήνα",
      avatar: null,
      content: "Το Delta με βοήθησε να βρω το ιδανικό μεταπτυχιακό πρόγραμμα. Η πληροφόρηση είναι πάντα έγκαιρη και ακριβής.",
      rating: 5,
    },
    {
      id: 2,
      name: "Γιώργος Κωνσταντίνου",
      role: "Υποψήφιος ΑΣΕΠ",
      avatar: null,
      content: "Χάρη στους οδηγούς ΑΣΕΠ του Delta, κατάφερα να περάσω στην πρώτη μου προσπάθεια. Απλά άψογοι!",
      rating: 5,
    },
    {
      id: 3,
      name: "Ελένη Νικολάου",
      role: "Αναπληρώτρια Καθηγήτρια",
      avatar: null,
      content: "Η καλύτερη πηγή για ενημέρωση ΟΠΣΥΔ. Όλα τα νέα σε ένα μέρος, με σαφήνεια και αξιοπιστία.",
      rating: 5,
    },
  ],
  contactBlock: {
    title: "Χρειάζεστε Καθοδήγηση;",
    description: "Η ομάδα του Delta είναι εδώ για να σας βοηθήσει με ερωτήματα για προγράμματα, ΑΣΕΠ, ΟΠΣΥΔ και πιστοποιήσεις.",
  },
  seo: {
    title: "Delta | Εκπαιδευτικές Ειδήσεις, Προγράμματα & Οδηγοί",
    description: "",
    canonicalUrl: `${WP_BASE_URL}/`,
    ogImage: null,
  },
};
