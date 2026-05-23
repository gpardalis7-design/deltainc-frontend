import { Database } from "lucide-react";
import { D } from "../Root";

export function MockBadge() {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
      style={{
        background: "rgba(197,141,42,0.12)",
        border: `1px solid rgba(197,141,42,0.3)`,
        color: D.accentStrong,
      }}
      title="Η σύνδεση με το Delta API δεν είναι διαθέσιμη — εμφανίζονται δεδομένα επίδειξης"
    >
      <Database size={11} />
      Demo mode — Delta API fallback
    </div>
  );
}
