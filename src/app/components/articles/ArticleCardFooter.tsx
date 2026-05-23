import { ArrowRight, Calendar } from "lucide-react";
import { D } from "../../Root";

type ArticleCardFooterProps = {
  dateLabel?: string;
  bordered?: boolean;
  dark?: boolean;
  showCalendarIcon?: boolean;
  ctaLabel?: string;
  trailingLabel?: string;
};

export function ArticleCardFooter({
  dateLabel,
  bordered = true,
  dark = false,
  showCalendarIcon = false,
  ctaLabel,
  trailingLabel,
}: ArticleCardFooterProps) {
  return (
    <div
      className={bordered ? "flex items-center justify-between text-xs pt-3" : "flex items-center justify-between text-xs"}
      style={{
        borderTop: bordered ? (dark ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${D.border}`) : "none",
        color: dark ? "rgba(255,255,255,0.5)" : "rgba(19,35,58,0.4)",
      }}
    >
      <span className="flex items-center gap-1">
        {dateLabel ? (
          <>
            {showCalendarIcon ? <Calendar size={11} /> : null}
            {dateLabel}
          </>
        ) : null}
      </span>
      {ctaLabel ? (
        <span
          className="flex items-center gap-1"
          style={{ color: dark ? D.accent : D.accent, fontWeight: 600 }}
        >
          {ctaLabel} <ArrowRight size={11} />
        </span>
      ) : (
        <span>{trailingLabel}</span>
      )}
    </div>
  );
}
