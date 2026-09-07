import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Link, useLocation } from "react-router";
import neapolisLogo from "../assets/pafos-logo.png";
import { sitePromotion } from "../lib/sitePromotion";
import styles from "./SitePromotionBanner.module.css";

const HEIGHT_PROPERTY = "--site-promotion-height";

function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function SitePromotionBanner() {
  const location = useLocation();
  const bannerRef = useRef<HTMLElement>(null);
  const dismissalKey = `delta:promotion:${sitePromotion.id}:dismissed`;
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(dismissalKey) === "true",
  );
  const [showAttention, setShowAttention] = useState(false);
  const currentPath = normalizePath(location.pathname);
  const isExcluded = sitePromotion.excludedPaths.some((path) => normalizePath(path) === currentPath);
  const isVisible = sitePromotion.enabled && !dismissed && !isExcluded;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const banner = bannerRef.current;

    if (!isVisible || !banner) {
      root.style.setProperty(HEIGHT_PROPERTY, "0px");
      return;
    }

    const syncHeight = () => root.style.setProperty(HEIGHT_PROPERTY, `${banner.offsetHeight}px`);
    const observer = new ResizeObserver(syncHeight);
    syncHeight();
    observer.observe(banner);

    return () => {
      observer.disconnect();
      root.style.setProperty(HEIGHT_PROPERTY, "0px");
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    setShowAttention(false);
    const timer = window.setTimeout(() => setShowAttention(true), 3000);
    return () => window.clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const hideForSession = () => {
    window.sessionStorage.setItem(dismissalKey, "true");
    setDismissed(true);
  };

  return (
    <aside ref={bannerRef} className={styles.banner} aria-label="Προτεινόμενο πρόγραμμα" data-site-promotion>
      <div className={styles.inner}>
        <span className={styles.logoWrap} aria-hidden="true">
          <img className={styles.logo} src={neapolisLogo} alt="" />
        </span>
        <p className={styles.message}>{sitePromotion.message}</p>
        <Link
          className={`${styles.cta} ${showAttention ? styles.ctaAttention : ""}`}
          to={sitePromotion.href}
          onClick={hideForSession}
          aria-label={`${sitePromotion.ctaLabel}: ${sitePromotion.logoAlt}`}
        >
          {sitePromotion.ctaLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <button className={styles.dismiss} type="button" onClick={hideForSession} aria-label="Κλείσιμο προσφοράς">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
