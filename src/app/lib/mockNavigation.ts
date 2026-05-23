import type { Navigation } from "./types";

export const MOCK_NAVIGATION: Navigation = {
  header: [
    { label: "ΟΠΣΥΔ", url: "/blog?hub=opsyd" },
    { label: "ΑΣΕΠ", url: "/blog?hub=asep" },
    { label: "Μεταπτυχιακά", url: "/courses" },
    { label: "Πιστοποιήσεις", url: "/blog?hub=pistopoihseis" },
  ],
  footer: [
    { label: "Επικοινωνία", url: "/about" },
    { label: "Προγράμματα", url: "/courses" },
    { label: "Blog", url: "/blog" },
  ],
};
