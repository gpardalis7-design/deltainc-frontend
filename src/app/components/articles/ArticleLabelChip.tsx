import { D } from "../../Root";

export function ArticleLabelChip({ label, className = "" }: { label?: string | null; className?: string }) {
  if (!label) return null;

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${className}`.trim()}
      style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
    >
      {label}
    </span>
  );
}
