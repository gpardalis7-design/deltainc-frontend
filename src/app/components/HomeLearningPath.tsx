import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * "Delta Learning Path" — a slim, premium *vertical* connector placed between
 * the major homepage sections. A short navy/blue line with academic milestone
 * nodes; as you scroll, a gold trail draws downward along the line with a small
 * gold dot at its head — the journey advances with your scroll. Purely
 * decorative (no text/UI); a continuation of the hero's floating-symbols visual.
 *
 * Same visual system across all three seams; only the milestones differ:
 *   step 1 (Hero → paths)        — introduction: a single graduation cap
 *   step 2 (paths → articles)    — guidance: compass → book
 *   step 3 (articles → programs) — progress: document → graduation cap
 */

type IconName = "cap" | "compass" | "book" | "document";
type Anchor = "top" | "mid" | "bottom";
type Milestone = { at: Anchor; icon?: IconName; gold?: boolean };

const NAVY = "#1e3a8a";
const GOLD = "#b9985a";
const GOLD_BRIGHT = "#e0c187";

// short vertical line, drawn top -> bottom
const VB_W = 56;
const VB_H = 140;
const X = 28;
const Y_TOP = 20;
const Y_BOTTOM = 120;
const LINE_D = `M ${X} ${Y_TOP} L ${X} ${Y_BOTTOM}`;

const ANCHORS: Record<Anchor, { x: number; y: number }> = {
  top: { x: X, y: 42 },
  mid: { x: X, y: 70 },
  bottom: { x: X, y: 98 },
};

const STEPS: Record<1 | 2 | 3, Milestone[]> = {
  1: [{ at: "mid", icon: "cap", gold: true }],
  2: [{ at: "top", icon: "compass" }, { at: "bottom", icon: "book", gold: true }],
  3: [{ at: "top", icon: "document" }, { at: "bottom", icon: "cap", gold: true }],
};

const ICON_PATHS: Record<IconName, string[]> = {
  cap: ["M3 9l9-4 9 4-9 4-9-4z", "M7 11v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4"],
  compass: ["M12 12 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0", "M16.24 7.76 L14.12 14.12 L7.76 16.24 L9.88 9.88 Z"],
  book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  document: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M9 13h6", "M9 17h6"],
};

function IconGlyph({ name, color }: { name: IconName; color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

export function LearningPathDivider({ step }: { step: 1 | 2 | 3 }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 15%"] });
  const dotCy = useTransform(scrollYProgress, [0, 1], [Y_TOP, Y_BOTTOM]);
  const trailLength = reduceMotion ? 0 : scrollYProgress;

  const milestones = STEPS[step];
  const strokeId = `lp-stroke-${step}`;

  return (
    <div aria-hidden="true" className="flex justify-center py-2">
      <div ref={ref} className="relative" style={{ width: VB_W, height: VB_H }}>
        {/* very soft blue glow behind the line */}
        <div
          className="pointer-events-none absolute"
          style={{ inset: "-36px -64px", background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.07), transparent 70%)" }}
        />
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={VB_W} height={VB_H} style={{ display: "block", position: "relative" }}>
          <defs>
            <linearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity="0.42" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor={NAVY} stopOpacity="0.42" />
            </linearGradient>
          </defs>

          {/* base line (navy/blue) */}
          <path d={LINE_D} fill="none" stroke={`url(#${strokeId})`} strokeWidth={2} strokeLinecap="round" />

          {/* gold trail that draws downward with scroll */}
          <motion.path
            d={LINE_D}
            fill="none"
            stroke={GOLD}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pathLength: trailLength }}
          />

          {/* milestone nodes */}
          {milestones.map((m) => {
            const p = ANCHORS[m.at];
            const accent = m.gold ? GOLD : NAVY;
            return (
              <g key={m.at}>
                {m.gold ? <circle cx={p.x} cy={p.y} r={18} fill="rgba(185,152,90,0.10)" /> : null}
                <circle cx={p.x} cy={p.y} r={13} fill="#ffffff" stroke={accent} strokeWidth={1.5} />
                <g transform={`translate(${p.x},${p.y}) scale(0.66) translate(-12,-12)`}>
                  <IconGlyph name={m.icon!} color={accent} />
                </g>
              </g>
            );
          })}

          {/* gold dot at the head of the trail (scroll-linked) */}
          <motion.circle cx={X} cy={reduceMotion ? Y_TOP : dotCy} r={8} fill={GOLD_BRIGHT} opacity={reduceMotion ? 0 : 0.22} />
          <motion.circle cx={X} cy={reduceMotion ? Y_TOP : dotCy} r={4} fill={GOLD_BRIGHT} opacity={reduceMotion ? 0 : 1} />
        </svg>
      </div>
    </div>
  );
}
