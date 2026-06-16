import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Award, Compass, FileText, GraduationCap, TrendingUp } from "lucide-react";
import { D } from "../Root";
import deltaMark from "../assets/delta-mark.svg";

type VisualNode = {
  id: string;
  Icon: typeof GraduationCap;
  size: number;
  left: string;
  top: string;
  accent?: "blue" | "gold";
  mobileHidden?: boolean;
  orbitX: number;
  orbitY: number;
  rotateRange: number;
  duration: number;
  delay: number;
};

const DESKTOP_NODES: VisualNode[] = [
  { id: "study", Icon: GraduationCap, size: 82, left: "5%", top: "16%", orbitX: 11, orbitY: 15, rotateRange: 5.2, duration: 11.8, delay: 0.1 },
  { id: "guidance", Icon: Compass, size: 66, left: "81%", top: "22%", accent: "gold", orbitX: -11, orbitY: 13, rotateRange: -5.8, duration: 10.4, delay: 0.7 },
  { id: "documents", Icon: FileText, size: 74, left: "73%", top: "65%", orbitX: 10, orbitY: -14, rotateRange: 5.4, duration: 12.9, delay: 0.35 },
  { id: "certifications", Icon: Award, size: 64, left: "14%", top: "73%", accent: "gold", orbitX: -10, orbitY: -13, rotateRange: -5.2, duration: 11.3, delay: 1.05 },
  { id: "progression", Icon: TrendingUp, size: 58, left: "52%", top: "7%", mobileHidden: true, orbitX: 7, orbitY: 9, rotateRange: 3.6, duration: 13.8, delay: 0.55 },
];

const MOBILE_NODES: VisualNode[] = [
  { id: "study-mobile", Icon: GraduationCap, size: 64, left: "4%", top: "28%", orbitX: 7, orbitY: 9, rotateRange: 3.5, duration: 11.4, delay: 0.15 },
  { id: "guide-mobile", Icon: Compass, size: 56, left: "75%", top: "17%", accent: "gold", orbitX: -7, orbitY: 8, rotateRange: -3.8, duration: 9.9, delay: 0.65 },
  { id: "docs-mobile", Icon: FileText, size: 60, left: "69%", top: "63%", orbitX: 7, orbitY: -9, rotateRange: 3.8, duration: 12.1, delay: 0.4 },
  { id: "award-mobile", Icon: Award, size: 52, left: "13%", top: "68%", accent: "gold", orbitX: -6, orbitY: -8, rotateRange: -3.4, duration: 10.8, delay: 0.95 },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduced(mediaQuery.matches);

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return reduced;
}

function BackgroundGrid({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 640 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="delta-hero-line" x1="64" y1="48" x2="556" y2="392" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(29,78,216,0.42)" />
          <stop offset="0.5" stopColor="rgba(15,23,42,0.13)" />
          <stop offset="1" stopColor="rgba(185,152,90,0.34)" />
        </linearGradient>
      </defs>

      <circle cx="320" cy="228" r="148" stroke="url(#delta-hero-line)" strokeWidth="1.35" />
      <circle cx="320" cy="228" r="194" stroke="rgba(29,78,216,0.15)" strokeWidth="1.1" strokeDasharray="4 10" />
      <circle cx="320" cy="228" r="106" stroke="rgba(29,78,216,0.1)" strokeWidth="1" />
      <path d="M320 228L126 114" stroke="url(#delta-hero-line)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M320 228L500 126" stroke="url(#delta-hero-line)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M320 228L472 336" stroke="url(#delta-hero-line)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M320 228L154 346" stroke="url(#delta-hero-line)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M320 228L326 56" stroke="rgba(29,78,216,0.2)" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M320 228C256 162 182 148 92 160" stroke="rgba(29,78,216,0.12)" strokeWidth="1" strokeLinecap="round" />
      <path d="M320 228C398 188 466 192 560 224" stroke="rgba(185,152,90,0.14)" strokeWidth="1" strokeLinecap="round" />

      {[
        [126, 114],
        [500, 126],
        [472, 336],
        [154, 346],
        [326, 56],
        [320, 228],
      ].map(([cx, cy], index) => (
        <circle
          key={`${cx}-${cy}-${index}`}
          cx={cx}
          cy={cy}
          r={index === 5 ? 5.5 : 4}
          fill={index === 5 ? D.accentStrong : "rgba(29,78,216,0.34)"}
        />
      ))}

      <g opacity="0.5">
        <circle cx="58" cy="54" r="3.5" fill="rgba(185,152,90,0.56)" />
        <circle cx="542" cy="370" r="4.5" fill="rgba(29,78,216,0.26)" />
        <circle cx="560" cy="88" r="3.8" fill="rgba(185,152,90,0.42)" />
        <circle cx="86" cy="378" r="5" fill="rgba(29,78,216,0.16)" />
        <circle cx="214" cy="42" r="2.8" fill="rgba(29,78,216,0.18)" />
        <circle cx="590" cy="238" r="3.2" fill="rgba(185,152,90,0.2)" />
      </g>
    </svg>
  );
}

function VisualNodeBubble({
  node,
  reducedMotion,
}: {
  node: VisualNode;
  reducedMotion: boolean;
}) {
  const tint = node.accent === "gold"
    ? {
        background: "linear-gradient(180deg, rgba(255,250,241,0.98) 0%, rgba(255,255,255,0.94) 100%)",
        ring: "rgba(185,152,90,0.3)",
        icon: D.warmAccentStrong,
      }
    : {
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,255,0.94) 100%)",
        ring: "rgba(29,78,216,0.26)",
        icon: D.accentStrong,
      };
  const animatedOrbit = reducedMotion
    ? undefined
    : {
        x: [0, node.orbitX, 0, -node.orbitX, 0],
        y: [0, -node.orbitY, 0, node.orbitY, 0],
        rotate: [0, node.rotateRange, 0, -node.rotateRange, 0],
      };

  return (
    <motion.div
      aria-hidden="true"
      className="absolute flex items-center justify-center rounded-full backdrop-blur-sm"
      animate={animatedOrbit}
      transition={
        reducedMotion
          ? undefined
          : {
              duration: node.duration,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
              delay: node.delay,
            }
      }
      style={{
        width: `${node.size}px`,
        height: `${node.size}px`,
        left: node.left,
        top: node.top,
        background: tint.background,
        border: `1px solid ${tint.ring}`,
        boxShadow: "0 16px 32px rgba(15,23,42,0.1)",
      }}
    >
      <div
        className="absolute inset-[9%] rounded-full"
        style={{
          border: `1px solid ${node.accent === "gold" ? "rgba(185,152,90,0.18)" : "rgba(29,78,216,0.14)"}`,
        }}
      />
      <node.Icon size={Math.round(node.size * 0.34)} style={{ color: tint.icon }} />
    </motion.div>
  );
}

function CentralBubbleLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex items-center justify-center">
      <img
        src={deltaMark}
        alt=""
        className="pointer-events-none select-none object-contain"
        style={{
          width: mobile ? "34px" : "48px",
          height: mobile ? "34px" : "48px",
        }}
      />
    </div>
  );
}

export function HomeHeroEcosystemVisual() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none select-none relative">
      <div className="relative lg:hidden h-[230px] sm:h-[280px] mt-2 overflow-visible">
        <motion.div
          className="absolute -left-12 top-8 h-32 w-32 rounded-full blur-3xl"
          style={{ background: "rgba(29,78,216,0.18)" }}
        />
        <motion.div
          className="absolute -right-4 bottom-2 h-28 w-28 rounded-full blur-3xl"
          style={{ background: "rgba(185,152,90,0.16)" }}
        />
        <motion.div
          className="absolute left-[18%] bottom-2 h-24 w-24 rounded-full blur-3xl"
          style={{ background: "rgba(29,78,216,0.1)" }}
        />

        <motion.div className="absolute inset-0">
          <BackgroundGrid className="absolute inset-0 h-full w-full opacity-[0.97]" />
        </motion.div>

        <div
          className="absolute left-[49%] top-1/2 flex h-[102px] w-[102px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,255,0.95) 100%)",
            border: `1px solid rgba(29,78,216,0.22)`,
            boxShadow: "0 22px 44px rgba(15,23,42,0.11)",
          }}
        >
          <div className="absolute inset-[11%] rounded-full" style={{ border: `1px solid rgba(29,78,216,0.12)` }} />
          <CentralBubbleLogo mobile />
        </div>

        {MOBILE_NODES.map((node) => (
          <VisualNodeBubble key={node.id} node={node} reducedMotion={reducedMotion} />
        ))}
      </div>

      <div className="relative hidden lg:block h-[430px] xl:h-[470px] overflow-visible -ml-10 xl:-ml-16">
        <motion.div
          className="absolute left-[-5%] top-12 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgba(29,78,216,0.2)" }}
        />
        <motion.div
          className="absolute right-[-2%] bottom-10 h-36 w-36 rounded-full blur-3xl"
          style={{ background: "rgba(185,152,90,0.16)" }}
        />
        <motion.div
          className="absolute left-[22%] bottom-10 h-28 w-28 rounded-full blur-3xl"
          style={{ background: "rgba(29,78,216,0.11)" }}
        />

        <motion.div className="absolute inset-0">
          <BackgroundGrid className="absolute inset-0 h-full w-full opacity-[1]" />
        </motion.div>

        <div
          className="absolute left-[47%] top-[50%] flex h-[144px] w-[144px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(247,250,255,0.94) 100%)",
            border: `1px solid rgba(29,78,216,0.22)`,
            boxShadow: "0 26px 54px rgba(15,23,42,0.12)",
          }}
        >
          <div className="absolute inset-[9%] rounded-full" style={{ border: `1px solid rgba(29,78,216,0.13)` }} />
          <div className="absolute inset-[22%] rounded-full" style={{ border: `1px dashed rgba(185,152,90,0.22)` }} />
          <CentralBubbleLogo />
        </div>

        {DESKTOP_NODES.map((node) => (
          <VisualNodeBubble key={node.id} node={node} reducedMotion={reducedMotion} />
        ))}
      </div>
    </div>
  );
}
