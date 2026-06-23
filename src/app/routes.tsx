import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { RouteErrorScreen } from "./components/RouteErrorScreen";
import {
  LegacyBlogHubRedirectPage,
  LegacyExactRedirectPage,
  LegacyProgramRedirectPage,
} from "./pages/LegacyRedirects";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <RouteErrorScreen />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import("./pages/Home")).Home }) },
      // Named pages — matched before the dynamic hub catch-all
      { path: "blog", lazy: async () => ({ Component: (await import("./pages/Blog")).Blog }) },
      { path: "blog/:slug", lazy: async () => ({ Component: (await import("./pages/BlogArticle")).BlogArticle }) },
      { path: "blog-hub", Component: LegacyBlogHubRedirectPage },
      { path: "news", Component: LegacyExactRedirectPage },
      { path: "επικοινωνια", Component: LegacyExactRedirectPage },
      { path: "kostologisi-ergasias", Component: LegacyExactRedirectPage },
      { path: "μεταπτυχιακά-search-engine", Component: LegacyExactRedirectPage },
      { path: "cookie-policy-eu", Component: LegacyExactRedirectPage },
      { path: "category/:categorySlug", lazy: async () => ({ Component: (await import("./pages/CategoryArchive")).CategoryArchive }) },
      { path: "program/:legacyProgramSlug", Component: LegacyProgramRedirectPage },
      { path: "grad-undergrad/:legacyProgramSlug", Component: LegacyProgramRedirectPage },
      { path: "μεταπτυχιακά-search-engine/:legacyProgramSlug", Component: LegacyProgramRedirectPage },
      { path: "υπηρεσιες/μεταπτυχιακά-search-engine/:legacyProgramSlug", Component: LegacyProgramRedirectPage },
      { path: "delta-apps/moria-calculator", lazy: async () => ({ Component: (await import("./pages/MoriaCalculator")).MoriaCalculator }) },
      { path: "delta-apps/salary-calculator", lazy: async () => ({ Component: (await import("./pages/SalaryCalculator")).SalaryCalculator }) },
      { path: "delta-apps", lazy: async () => ({ Component: (await import("./pages/DeltaApps")).DeltaApps }) },
      { path: "contact", lazy: async () => ({ Component: (await import("./pages/Contact")).Contact }) },
      { path: "assignments", lazy: async () => ({ Component: (await import("./pages/Assignments")).Assignments }) },
      { path: "asep/graptos-diagonismos", lazy: async () => ({ Component: (await import("./pages/GraptosDiagonismos")).GraptosDiagonismos }) },
      { path: "courses", lazy: async () => ({ Component: (await import("./pages/Courses")).Courses }) },
      { path: "courses/:slug", lazy: async () => ({ Component: (await import("./pages/ProgramDetails")).ProgramDetails }) },
      { path: "about", lazy: async () => ({ Component: (await import("./pages/About")).About }) },
      { path: "privacy-policy", lazy: async () => ({ Component: (await import("./pages/PrivacyPolicy")).PrivacyPolicy }) },
      { path: "cookie-policy", lazy: async () => ({ Component: (await import("./pages/CookiePolicy")).CookiePolicy }) },
      { path: "terms", lazy: async () => ({ Component: (await import("./pages/Terms")).Terms }) },
      // Dynamic hub pages — any slug not matched above goes here.
      // Hub.tsx reads the WP category list from context to validate the slug.
      { path: ":hubSlug", lazy: async () => ({ Component: (await import("./pages/Hub")).Hub }) },
    ],
  },
]);
