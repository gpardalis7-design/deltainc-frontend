import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import styles from "./OrbitConstellation.module.css";

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

type OrbitConstellationProps = {
  eyebrow?: string;
  title?: string;
  caption?: string;
  centerIcon?: ReactNode;
  centerHref?: string;
  centerAriaLabel?: string;
  nodes?: OrbitNode[];
};

const DEFAULT_NODES: OrbitNode[] = [
  { icon: <AwardIcon />, r: 74, a: 25, dur: 30, pd: 0 },
  { icon: <CoinIcon />, r: 74, a: 205, dur: 30, pd: 1.2 },
  { icon: <ClockIcon />, r: 108, a: 95, dur: 40, pd: 0.6, dir: "reverse" },
  { icon: <TrendingIcon />, r: 108, a: 255, dur: 40, pd: 1.8, dir: "reverse" },
  { icon: <LaptopIcon />, r: 140, a: 340, dur: 52, pd: 0.9 },
];

export function OrbitConstellation({
  eyebrow = "Με κριτήρια, όχι στην τύχη",
  title = "Όλα οδηγούν στο σωστό πρόγραμμα.",
  caption = "Μοριοδότηση · Δίδακτρα · Διάρκεια · Προοπτικές · Εξ αποστάσεως",
  centerIcon = <CapIcon />,
  centerHref,
  centerAriaLabel = "Μετάβαση στην αναζήτηση προγραμμάτων",
  nodes = DEFAULT_NODES,
}: OrbitConstellationProps) {
  const centerClassName = centerHref ? `${styles.core} ${styles.coreLink}` : styles.core;

  return (
    <div className={styles.panel}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <p className={styles.title}>{title}</p>

      <div className={styles.stage}>
        <span className={styles.ring} style={{ "--d": "148px", "--rs": "90s" } as CSSProperties} />
        <span className={styles.ring} style={{ "--d": "216px", "--rs": "120s", "--rd": "reverse" } as CSSProperties} />
        <span className={styles.ring} style={{ "--d": "280px", "--rs": "150s" } as CSSProperties} />

        <span className={styles.halo} />
        {centerHref ? (
          <Link to={centerHref} className={centerClassName} aria-label={centerAriaLabel}>
            {centerIcon}
          </Link>
        ) : (
          <span className={centerClassName}>{centerIcon}</span>
        )}

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

      <p className={styles.caption}>{caption}</p>
    </div>
  );
}

/* --- inline icons (outline, inherit color via currentColor) --- */
const ico = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CapIcon() {
  return (
    <svg {...ico} width={26} height={26}>
      <path d="M3 9l9-4 9 4-9 4-9-4z" />
      <path d="M7 11v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4" />
    </svg>
  );
}
function AwardIcon() {
  return (
    <svg {...ico}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg {...ico}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.5a3 3 0 1 0 0 5M9 11h4M9 13h4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...ico}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function TrendingIcon() {
  return (
    <svg {...ico}>
      <path d="M3 16l6-6 4 4 8-8" />
      <path d="M15 6h6v6" />
    </svg>
  );
}
function LaptopIcon() {
  return (
    <svg {...ico}>
      <rect x="4" y="6" width="16" height="10" rx="1.5" />
      <path d="M2 19h20" />
    </svg>
  );
}
