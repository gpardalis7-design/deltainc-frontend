import { useEffect } from "react";
import { useNavigation, NavigationMode, NavigationCTA } from "./navigationContext";

interface PageNavigationConfig {
  mode: NavigationMode;
  cta?: NavigationCTA;
  showStickyBottom?: boolean;
}

/**
 * Hook to configure navigation mode and CTA for a specific page.
 * Call this at the top of your page component.
 */
export function usePageNavigation(config: PageNavigationConfig) {
  const { setMode, setCTA, setShowStickyBottom } = useNavigation();

  useEffect(() => {
    setMode(config.mode);
    if (config.cta) {
      setCTA(config.cta);
    }
    if (config.showStickyBottom !== undefined) {
      setShowStickyBottom(config.showStickyBottom);
    }

    // Reset to defaults on unmount
    return () => {
      setMode("content");
      setCTA({ text: "Αναζήτηση Προγραμμάτων", link: "/courses", variant: "primary" });
      setShowStickyBottom(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.mode, config.cta?.text, config.cta?.link, config.cta?.formType, config.showStickyBottom]);
}