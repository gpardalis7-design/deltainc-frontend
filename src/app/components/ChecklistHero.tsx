import { useEffect, useState } from "react";
import styles from "./ChecklistHero.module.css";

type Step = { sub: string; title: string };

const DEFAULT_STEPS: Step[] = [
  { sub: "Βήμα 1", title: "Επιλέγω προκήρυξη" },
  { sub: "Βήμα 2", title: "Διαβάζω το ΦΕΚ" },
  { sub: "Βήμα 3", title: "Συλλέγω δικαιολογητικά" },
  { sub: "Βήμα 4", title: "Κάνω αίτηση" },
];

type ChecklistHeroProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  steps?: Step[];
  stepDuration?: number;
  loopPause?: number;
};

export function ChecklistHero({
  eyebrow = "Οδηγός υποψηφίου",
  title = "Από την προκήρυξη στην αίτηση",
  subtitle = "Τέσσερα απλά βήματα μέχρι την υποβολή.",
  steps = DEFAULT_STEPS,
  stepDuration = 1050,
  loopPause = 1700,
}: ChecklistHeroProps) {
  const total = steps.length;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setCurrent(total);
      return;
    }

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const run = () => {
      setCurrent(step);
      const delay = step >= total ? loopPause : stepDuration;
      timer = setTimeout(() => {
        step = step >= total ? 0 : step + 1;
        run();
      }, delay);
    };

    run();
    return () => clearTimeout(timer);
  }, [total, stepDuration, loopPause]);

  const progress = total > 1 ? Math.min(current, total - 1) / (total - 1) : 1;

  return (
    <aside className={styles.hero} aria-label={title}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>

      <ol className={styles.list}>
        <span className={styles.track} aria-hidden="true" />
        <span
          className={styles.fill}
          aria-hidden="true"
          style={{ transform: `scaleY(${progress})` }}
        />
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "active" : "pending";

          return (
            <li key={`${step.sub}-${step.title}`} className={styles.row} data-state={state}>
              <span className={styles.circle}>
                {state === "done" ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path
                      d="M5 13l4 4L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </span>
              <span className={styles.text}>
                <span className={styles.sub}>{step.sub}</span>
                <span className={styles.stepTitle}>{step.title}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
