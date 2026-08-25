import type {
  DeltaHub,
} from "./types";

const WP_BASE_URL = import.meta.env.VITE_WP_BASE_URL || "https://deltainc.gr";

export const MOCK_HUBS: DeltaHub[] = [
  { id: "opsyd", name: "ΟΠΣΥΔ", displayNameOverride: "ΟΠΣΥΔ", slug: "opsyd", description: "Οδηγοί, ανακοινώσεις και πρακτικές πληροφορίες για εκπαιδευτικούς.", url: `${WP_BASE_URL}/category/opsyd-proslipsis-anaplirwtwn/`, featuredImage: null, wpCategoryId: 342, count: 0 },
  { id: "asep", name: "ΑΣΕΠ", displayNameOverride: "ΑΣΕΠ", slug: "asep", description: "Προθεσμίες, οδηγοί και ενημερώσεις δημόσιου τομέα.", url: `${WP_BASE_URL}/category/prokirykseis-asep-sox/`, featuredImage: null, wpCategoryId: 285, count: 0 },
  { id: "metaptyxiaka", name: "Μεταπτυχιακά", displayNameOverride: "Μεταπτυχιακά", slug: "metaptyxiaka", description: "Ανακαλύψτε μεταπτυχιακά προγράμματα σε όλη την Ελλάδα.", url: `${WP_BASE_URL}/category/metaptychiaka/`, featuredImage: null, wpCategoryId: 286, count: 0 },
  { id: "pistopoihseis", name: "Καριέρα - Πιστοποιήσεις", slug: "pistopoihseis", description: "Πιστοποιήσεις για εκπαιδευτικούς και επαγγελματίες.", url: `${WP_BASE_URL}/pistopoihseis/`, featuredImage: null, wpCategoryId: 349, count: 0 },
];
