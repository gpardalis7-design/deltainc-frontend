import { useEffect, useState } from "react";
import { ChevronDown, ListTree } from "lucide-react";
import type { ArticleTocHeading } from "../lib/articleTocCore.mjs";
import styles from "./ArticleTableOfContents.module.css";

const DESKTOP_INITIAL_SECTIONS = 8;
const MOBILE_QUERY = "(max-width: 767px)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ArticleTableOfContents({ headings }: { headings: ArticleTocHeading[] }) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [isOpen, setIsOpen] = useState(() => !window.matchMedia(MOBILE_QUERY).matches);
  const [showAll, setShowAll] = useState(false);
  const [expandedH3Groups, setExpandedH3Groups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      setIsOpen(!event.matches);
      setShowAll(false);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const visibleHeadings = !showAll
    ? headings.slice(0, DESKTOP_INITIAL_SECTIONS)
    : headings;
  const hasMoreSections = headings.length > DESKTOP_INITIAL_SECTIONS;
  const sectionLabel = `${headings.length} ${headings.length === 1 ? "ενότητα" : "ενότητες"}`;

  const navigateToHeading = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const hash = `#${encodeURIComponent(id)}`;
    window.history.pushState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);

    const scrollToTarget = () => {
      const scrollOffset = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - scrollOffset);
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };

    if (isMobile) {
      setIsOpen(false);
      setShowAll(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToTarget));
      return;
    }

    scrollToTarget();
  };

  const toggleH3Group = (id: string) => {
    setExpandedH3Groups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className={styles.toc} aria-label="Περιεχόμενα άρθρου">
      <button
        type="button"
        className={styles.header}
        onClick={() => {
          if (isMobile && isOpen) setShowAll(false);
          setIsOpen((current) => !current);
        }}
        aria-expanded={isOpen}
        aria-controls="delta-article-toc-sections"
      >
        <span className={styles.headerIcon} aria-hidden="true"><ListTree size={18} /></span>
        <span className={styles.headerText}>Περιεχόμενα άρθρου</span>
        <span className={styles.count}>{sectionLabel}</span>
        <ChevronDown className={`${styles.headerChevron} ${isOpen ? styles.rotated : ""}`} size={18} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id="delta-article-toc-sections" className={styles.content}>
          <ol className={styles.h2List}>
            {visibleHeadings.map((heading, index) => {
              const isGroupOpen = expandedH3Groups.has(heading.id);
              return (
                <li key={heading.id} className={styles.h2Item}>
                  <div className={styles.h2Row}>
                    <span className={styles.listNumber} aria-hidden="true">{index + 1}.</span>
                    <a className={styles.h2Link} href={`#${heading.id}`} onClick={(event) => navigateToHeading(event, heading.id)}>
                      {heading.text}
                    </a>
                    {heading.children.length > 0 ? (
                      <button
                        type="button"
                        className={styles.groupToggle}
                        onClick={() => toggleH3Group(heading.id)}
                        aria-expanded={isGroupOpen}
                        aria-controls={`delta-toc-children-${heading.id}`}
                        aria-label={`${isGroupOpen ? "Απόκρυψη" : "Εμφάνιση"} υποενοτήτων: ${heading.text}`}
                      >
                        <ChevronDown className={isGroupOpen ? styles.rotated : ""} size={17} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  {heading.children.length > 0 && isGroupOpen ? (
                    <ol id={`delta-toc-children-${heading.id}`} className={styles.h3List}>
                      {heading.children.map((child, childIndex) => (
                        <li key={child.id}>
                          <span className={styles.h3Number} aria-hidden="true">{index + 1}.{childIndex + 1}</span>
                          <a href={`#${child.id}`} onClick={(event) => navigateToHeading(event, child.id)}>
                            {child.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              );
            })}
          </ol>

          {hasMoreSections ? (
            <button type="button" className={styles.showAll} onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Εμφάνιση λιγότερων" : "Εμφάνιση όλων"}
              <ChevronDown className={showAll ? styles.rotated : ""} size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
