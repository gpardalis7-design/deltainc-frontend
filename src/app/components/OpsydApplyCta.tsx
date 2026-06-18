import type { ReactNode } from "react";
import styles from "./OpsydApplyCta.module.css";

type OpsydApplyCtaProps = {
  href?: string;
  variant?: "pulse" | "float" | "nudge";
  label?: string;
  hint?: string;
  icon?: ReactNode;
};

export function OpsydApplyCta({
  href = "https://forms.gle/TeA65eEdv8BxnHmo6",
  variant = "pulse",
  label = "Αιτήσεις ΟΠΣΥΔ",
  hint = "Κάντε κλικ για τη φόρμα",
  icon,
}: OpsydApplyCtaProps) {
  return (
    <a
      className={`${styles.link} ${styles[variant]}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} - άνοιγμα φόρμας`}
    >
      <span className={styles.eyebrow}>Τι χρειάζεστε τώρα;</span>
      <span className={styles.headline}>Αναλαμβάνουμε την αίτησή σας στο ΟΠΣΥΔ</span>
      <span className={styles.description}>Με εχεμύθεια, σωστή σειρά ελέγχων και χωρίς λάθη στα δικαιολογητικά.</span>
      <span className={styles.wrap}>
        <span className={styles.ping} aria-hidden="true" />
        <span className={styles.ping} aria-hidden="true" />
        <span className={styles.circle} aria-hidden="true">
          {icon ?? <FileIcon />}
        </span>
      </span>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </a>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
