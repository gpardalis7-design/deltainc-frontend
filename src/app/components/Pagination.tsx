import { ChevronLeft, ChevronRight } from "lucide-react";
import { D } from "../Root";

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  scrollTargetId?: string; // id of element to scroll to on page change
}

/**
 * Builds a smart page window: always includes first and last page,
 * shows ≤2 siblings around the current page, and inserts "…" where needed.
 * Examples:
 *   page=1,  total=20 → [1,2,3,4,5,"…",20]
 *   page=7,  total=20 → [1,"…",5,6,7,8,9,"…",20]
 *   page=19, total=20 → [1,"…",16,17,18,19,20]
 *   page=3,  total=5  → [1,2,3,4,5]
 */
function buildPageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const siblings = 2;
  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);
  const pages: (number | "…")[] = [1];
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  total,
  itemLabel = "αποτελέσματα",
  onPageChange,
  scrollTargetId,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // NOTE: deliberately NOT named "window" to avoid shadowing the global.
  const pageWindow = buildPageWindow(page, totalPages);

  const go = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return;
    onPageChange(p);
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      globalThis.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
      style={{ borderTop: `1px solid ${D.border}` }}
    >
      {/* Count label */}
      <p className="text-sm order-2 sm:order-1" style={{ color: D.inkSoft }}>
        {total != null && (
          <span>
            <span style={{ color: D.ink, fontWeight: 600 }}>{total.toLocaleString("el-GR")}</span>{" "}
            {itemLabel} ·{" "}
          </span>
        )}
        Σελίδα{" "}
        <span style={{ color: D.ink, fontWeight: 600 }}>{page}</span> από{" "}
        <span style={{ color: D.ink, fontWeight: 600 }}>{totalPages}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => go(page - 1)}
          disabled={page === 1}
          aria-label="Προηγούμενη σελίδα"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink }}
          onMouseEnter={(e) => { if (page !== 1) (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page numbers */}
        {pageWindow.map((item, idx) =>
          item === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-sm select-none"
              style={{ color: D.inkSoft }}
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => go(item as number)}
              aria-label={`Σελίδα ${item}`}
              aria-current={page === item ? "page" : undefined}
              className="w-9 h-9 rounded-xl text-sm transition-all duration-150"
              style={
                page === item
                  ? { background: D.ink, color: "#fff", fontWeight: 700 }
                  : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }
              }
              onMouseEnter={(e) => {
                if (page !== item) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)";
                  (e.currentTarget as HTMLElement).style.color = D.ink;
                }
              }}
              onMouseLeave={(e) => {
                if (page !== item) {
                  (e.currentTarget as HTMLElement).style.borderColor = D.border;
                  (e.currentTarget as HTMLElement).style.color = D.inkSoft;
                }
              }}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          aria-label="Επόμενη σελίδα"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink }}
          onMouseEnter={(e) => { if (page !== totalPages) (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}