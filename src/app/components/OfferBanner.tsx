import type { MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import { D } from "../Root";

export interface OfferBannerProps {
  badge: string;
  price: string;
  supportingText: string;
  infoPills: string[];
  clarificationText: string;
  ctaLabel: string;
  ctaTarget: string;
  microcopy: string;
  onCtaClick?: () => void;
}

export function OfferBanner({
  badge,
  price,
  supportingText,
  infoPills,
  clarificationText,
  ctaLabel,
  ctaTarget,
  microcopy,
  onCtaClick,
}: OfferBannerProps) {
  const handleCtaClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onCtaClick) {
      event.preventDefault();
      onCtaClick();
      return;
    }

    if (!ctaTarget.startsWith("#")) return;

    const target = document.querySelector<HTMLElement>(ctaTarget);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      aria-label={`${badge}: ${price}`}
      className="overflow-hidden rounded-3xl px-5 py-5 md:px-8 md:py-8 lg:px-10"
      style={{
        background: D.surfaceStrong,
        border: `1px solid ${D.border}`,
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.055)",
      }}
    >
      <div className="grid items-center gap-5 md:gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(15rem,3fr)] lg:gap-10">
        <div className="min-w-0">
          <div
            className="mb-2 inline-flex rounded-full px-3 py-1 text-[0.68rem] uppercase md:mb-3"
            style={{
              background: D.accentWash,
              border: `1px solid ${D.accentBorderSoft}`,
              color: D.accentStrong,
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            {badge}
          </div>

          <h2
            className="type-display-section mb-2 md:mb-3"
            style={{ color: D.ink, fontSize: "clamp(1.9rem, 4vw, 2.65rem)", lineHeight: 1.05, letterSpacing: "-0.035em" }}
          >
            {price}
          </h2>

          <p className="max-w-3xl text-sm leading-[1.55] md:text-base md:leading-[1.7]" style={{ color: D.inkSoft }}>
            {supportingText}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 md:mt-5" aria-label="Βασικά στοιχεία προγράμματος">
            {infoPills.map((pill) => (
              <span
                key={pill}
                className="rounded-full px-3 py-1.5 text-xs"
                style={{ background: D.bg, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 650 }}
              >
                {pill}
              </span>
            ))}
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-[1.6] md:mt-5 md:text-sm md:leading-[1.7]" style={{ color: D.inkSoft }}>
            {clarificationText}
          </p>
        </div>

        <div className="lg:border-l lg:pl-10" style={{ borderColor: D.border }}>
          <a
            href={ctaTarget}
            onClick={handleCtaClick}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-center text-sm transition-opacity hover:opacity-90"
            style={{ background: D.ink, color: "#fff", fontWeight: 750 }}
          >
            {ctaLabel} <ArrowRight size={16} aria-hidden="true" />
          </a>
          <p className="mt-2 text-center text-xs leading-[1.45] md:mt-3 md:leading-[1.55]" style={{ color: D.inkSoft }}>
            {microcopy}
          </p>
        </div>
      </div>
    </section>
  );
}
