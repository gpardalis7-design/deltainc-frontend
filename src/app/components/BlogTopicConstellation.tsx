import type { CSSProperties, ReactNode } from "react";
import styles from "./BlogTopicConstellation.module.css";

type OrbitNode = {
  icon: ReactNode;
  /** orbit radius, px */
  r: number;
  /** start angle, deg */
  a: number;
  /** seconds per revolution */
  dur: number;
  /** spoke pulse delay, seconds */
  pd: number;
  dir?: "normal" | "reverse";
};

type BlogTopicConstellationProps = {
  eyebrow?: string;
  caption?: string;
  centerIcon?: ReactNode;
  nodes?: OrbitNode[];
};

const DEFAULT_NODES: OrbitNode[] = [
  { icon: <SchoolIcon />, r: 74, a: 25, dur: 30, pd: 0 },
  { icon: <ClipboardIcon />, r: 74, a: 205, dur: 30, pd: 1.2 },
  { icon: <UsersIcon />, r: 108, a: 95, dur: 40, pd: 0.6, dir: "reverse" },
  { icon: <CertificateIcon />, r: 108, a: 255, dur: 40, pd: 1.8, dir: "reverse" },
  { icon: <NewsIcon />, r: 140, a: 340, dur: 52, pd: 0.9 },
];

export function BlogTopicConstellation({
  eyebrow = "Εξερευνήστε ανά θέμα",
  caption = "ΑΣΕΠ · ΟΠΣΥΔ · Μεταπτυχιακά · Εκπαίδευση · Πιστοποιήσεις",
  centerIcon = <BookIcon />,
  nodes = DEFAULT_NODES,
}: BlogTopicConstellationProps) {
  return (
    <div className={styles.panel}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}

      <div className={styles.stage}>
        <span className={styles.ring} style={{ "--d": "148px", "--rs": "90s" } as CSSProperties} />
        <span className={styles.ring} style={{ "--d": "216px", "--rs": "120s", "--rd": "reverse" } as CSSProperties} />
        <span className={styles.ring} style={{ "--d": "280px", "--rs": "150s" } as CSSProperties} />

        <span className={styles.halo} />
        <span className={styles.core}>{centerIcon}</span>

        {nodes.map((n, i) => (
          <div
            key={i}
            className={styles.arm}
            style={{ "--r": `${n.r}px`, "--a": `${n.a}deg`, "--dur": `${n.dur}s`, "--dir": n.dir ?? "normal" } as CSSProperties}
          >
            <span className={styles.spoke} style={{ "--pd": `${n.pd}s` } as CSSProperties} />
            <span className={styles.node}>{n.icon}</span>
          </div>
        ))}
      </div>

      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}

/* --- inline icons (outline, inherit color via currentColor) --- */
const ti = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function BookIcon() {
  return (
    <svg {...ti} width={25} height={25}>
      <path d="M4 5a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M20 5a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2V5z" />
    </svg>
  );
}
function SchoolIcon() {
  return (
    <svg {...ti} width={20} height={20}>
      <path d="M3 9l9-4 9 4-9 4-9-4z" />
      <path d="M7 11v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg {...ti} width={20} height={20}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0M9 11h6M9 15h4" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg {...ti} width={20} height={20}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5M21 20a6 6 0 0 0-4-5.6" />
    </svg>
  );
}
function CertificateIcon() {
  return (
    <svg {...ti} width={20} height={20}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5" />
    </svg>
  );
}
function NewsIcon() {
  return (
    <svg {...ti} width={20} height={20}>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z" />
      <path d="M17 8h3v9a2 2 0 0 1-2 2M7 8h6M7 11h6M7 14h4" />
    </svg>
  );
}
