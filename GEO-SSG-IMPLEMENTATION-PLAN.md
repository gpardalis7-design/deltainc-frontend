# Delta — GEO / SSG Implementation Plan

**Status:** Approved scope, awaiting go-ahead to implement
**Created:** 2026-06-23
**Cutover target:** 2026-06-28 (gated, not dated — flip only when the hard gates are green)
**Publisher identity:** "Delta" (matches live Yoast; no change)

---

## 1. Why this work exists (read this first)

The current public `deltainc.gr` is a **fully server-rendered WordPress + Elementor site** — its HTML contains real content, so it is **crawlable today** by Google and AI engines, and presumably ranks.

The new React frontend (`test.deltainc.gr`) is a **client-rendered SPA** — blank to anything that doesn't execute JavaScript.

**Therefore, cutting `deltainc.gr` over to the React app *without* this work is a regression** from fully-crawlable to blank-to-crawlers, risking existing Google rankings **and** AI visibility overnight. This project is a **prerequisite to the cutover**, not an enhancement after it. The cutover date is the hard deadline for the work below.

The business goal on top of preserving crawlability: be **readable and citable by AI answer engines** (ChatGPT, Perplexity, Claude, Google AI). Note: Google already renders the SPA and sees content, so the *new* upside here is primarily for **non-JS AI crawlers** (GEO).

---

## 2. Key findings (from live inspection, 2026-06-23)

- **Blog:** 373/374 posts have real bodies; clean semantic HTML (14 are Elementor-built). Ready for SSG.
- **Programs (courses):** 47 total, two data models — all expose an `acf` object via REST.
  - **New (ACF):** `overview`/`curriculum`/`admissions`/`outcomes`/`duration` + taxonomies `program_university`/`program_city`/`program_mode`/`uni_type`/`program_level`/`program_category`. Rich structured HTML (1,200–2,500 chars/field). **Ideal for SSG + `Course` JSON-LD.**
  - **Old (Elementor):** content in `content.rendered` div-soup (text present, already rendered on the live site, so SSG adds no new visual breakage; some leaked `[shortcode]` text to clean).
  - Split: 1 fully ACF (`iatriki-unic-athens`), 13 ACF + leftover body, 33 Elementor-only.
  - **All 47 have `program_university` + `uni_type`** → 100% `Course`-schema provider coverage.
  - Minor: ACF HTML carries editor-cruft classes (`isSelectedEnd`) to strip.
- **Featured images:** all sampled return `200` + `image/*`. The original bug was isolated to `og-default` pointing at the wrong host (already fixed).
- **Authors:** no real person-authors exposed via REST (WP `/users` restricted) → use **Organization byline "Delta"**; `Person` author pages deferred.
- **Architecture (favorable):** centralized data layer (`lib/deltaApi.ts`, `lib/api/*`); route inventory already declared in `sitePolicy.json` (`indexableStaticRoutes` + redirect map); hub editorial content is hardcoded config (`GUIDED_HUB_DATA`) + WP post lists (prerender-friendly).
- **Stack:** Vite + React Router 7.17 (library mode, `createBrowserRouter`), React 18.3.1, `react-helmet-async`, Vercel. Headless WordPress at `deltainc.gr/wp-json` (→ `cms.deltainc.gr` at cutover). Data currently fetched client-side via `useEffect` + skeleton. ~30 files touch browser globals (relevant only to the deferred true-SSG phase). GA4 `G-6V7M5W9LNQ`, manual `page_view`, rich event taxonomy.

---

## 3. Decisions locked

- **Approach:** lowest-risk, additive — *inject* real crawlable content into the per-route HTML the build already produces. **No hydration** (see §5), so no hydration-mismatch class of bugs. True SSG + hydration is **deferred** to Phase 9.
- **Publisher identity:** "Delta".
- **ACF migration of the 33 Elementor programs:** editorial work, done by the team in WordPress, before cutover where possible — but **not a hard gate** (hybrid fallback renders un-migrated programs).
- **Vercel:** move to **Pro** (required for commercial use + deployment-gating).
- **Analytics:** keep GA4 property `G-6V7M5W9LNQ` (confirm it matches the live WP Site Kit property), re-register conversions on the app's event names, annotate the cutover, verify a single `page_view`.
- **i18n:** prepare cheaply now (URL pattern, locale in canonical/sitemap, `og:locale`), build later.

---

## 4. Working method (applies to every phase)

- **One git branch per phase**, off `main`; merge only after the phase's **test gate** passes. This is the rollback unit.
- **Every phase deploys to a Vercel preview** (staging, `noindex`) and is verified there. **Production is untouched until Phase 8.**
- **Two verification layers, both required:**
  - *Build-time:* `verify-social-previews.mjs` (fails the build on structural problems).
  - *Post-deploy:* a harness (curl for headers/HTML/status + Playwright for console/hydration warnings) run against the **preview URL** — the only thing that can test real routing, hydration warnings, and image reachability.
- **Extend, don't replace:** build on the existing chain
  `generate-site-artifacts.mjs` → `vite build` → `generate-social-pages.mjs` → `verify-social-previews.mjs`.

---

## 5. The content-injection mechanism (settled)

For each route, at build time:
1. **Render the body** to static HTML (via `react-dom/server` on the content subtree, so there is no separate template to drift from the React components).
2. **Inject** it into `#root` in the per-route HTML file.
3. **Embed** that route's data as escaped JSON in the page.
4. The page component (`BlogArticle`, `ProgramDetails`, …) **reads the embedded data as initial state** instead of fetching in `useEffect`.

Result: the app uses `createRoot` and re-renders content → content (no skeleton, no flash). **Non-JS AI crawlers get the real body; Google and humans get content immediately.** Because we re-render rather than hydrate, the hydration-mismatch failure class does not apply.

---

## 6. Environment variables

| Var | Staging | Production |
|---|---|---|
| `VITE_SITE_URL` | `https://test.deltainc.gr` | `https://deltainc.gr` |
| `VITE_CANONICAL_SITE_URL` | `https://deltainc.gr` | `https://deltainc.gr` |
| `VITE_WP_BASE_URL` | `https://deltainc.gr` | `https://cms.deltainc.gr` |
| `VITE_ALLOW_INDEXING` | `false` | `true` |
| `VITE_GA_MEASUREMENT_ID` | `G-6V7M5W9LNQ` (confirm = WP Site Kit) | same |

---

## 7. Hard cutover gates (all must be green before Phase 8)

1. Blog + course + hub crawlable content shipped and verified on staging.
2. Legacy redirects mapped + tested — **no 404s on currently-ranking WP URLs**.
3. WordPress live at `cms.deltainc.gr`, REST + images confirmed.
4. GA4 continuity confirmed (same property, single `page_view`, conversions registered).
5. Post-deploy verification passes on the preview.

---

## 8. Phases

Each phase: **Goal / Changes / Test gate / Commit & rollback.**

### Phase 0 — Baseline & safety net *(no behavior change)*
- **Goal:** clean known-good baseline + the verification harness all later phases use.
- **Changes:** branch off `main`; confirm `pnpm build` runs clean; commit the currently-uncommitted social-preview work as baseline; add the post-deploy verification harness (curl + Playwright), parameterized by target URL.
- **Test gate:** baseline build succeeds; harness green against current staging for what's already true (og:image 200, routing); no change to live behavior.
- **Commit & rollback:** merge to `main`. Rollback: none needed (additive).

### Phase 1 — Robots, AI policy & sitemap hygiene *(config only)*
- **Goal:** allow AI discovery engines, block training crawlers, fix discovery files.
- **Changes:** production `robots.txt` — allow `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-User`, `Claude-SearchBot`; block `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`, `Meta-ExternalAgent`, `Applebot-Extended`, `Amazonbot`; reference sitemap(s). Ensure `sitemap.xml` uses `VITE_CANONICAL_SITE_URL`.
- **Test gate:** `robots.txt` served correctly on preview; allowed UAs not blocked; sitemap validates with canonical host.
- **Commit & rollback:** merge. Rollback: revert one file.

### Phase 2 — Blog crawlable content *(main GEO win — sub-staged)*
**2a — Mechanism spike (1 route)**
- **Changes:** prove the §5 mechanism on one article (render content subtree via `react-dom/server`, inject into `#root`, embed JSON, `BlogArticle` reads embedded data).
- **Test gate (real preview deploy):** raw HTML (fetched as `facebookexternalhit`) has the article `<h1>` + body + `Article` JSON-LD — **not a skeleton, not the homepage title**; the per-route file is served (not the shell); human load shows content immediately; **zero console/hydration warnings**; exactly one GA `page_view`.

**2b — Roll out to all 373 posts**
- **Changes:** extend `generate-social-pages.mjs` to do 2a for every `/blog/:slug`; emit `Article`/`BlogPosting` JSON-LD (Organization byline "Delta", dates, featured image, breadcrumb); extend `verify-social-previews.mjs` with body + JSON-LD assertions.
- **Test gate:** all 373 generate; build verifier asserts one each of title/canonical/og/JSON-LD + real `<h1>`+body; deploy to preview; post-deploy harness checks a sample incl. **encoded Greek slugs**, images 200/`image/*`, 404 on unknown `/blog/*`, staging `noindex`.
- **Commit & rollback:** merge after gate; rollback = revert branch.

### Phase 3 — Course/program crawlable content *(ACF-first, hybrid fallback)*
- **Goal:** all 47 programs crawlable, cleanly where ACF exists.
- **Changes:** for `/courses/:slug`, render from **ACF fields** when populated (overview/curriculum/admissions/outcomes/duration + resolved taxonomies), **fall back to Elementor `content.rendered`** otherwise; strip `isSelectedEnd` cruft; emit `Course` JSON-LD with the real provider (`program_university`); embed route data; `ProgramDetails` reads it.
- **Test gate:** all 47 generate; verifier passes; preview deploy; spot-check an ACF program, an Elementor program, and `iatriki`; `Course` JSON-LD validates in the Schema validator; images 200.
- **Commit & rollback:** merge after gate.

### Phase 4 — Hubs, archives, static pages, homepage
- **Goal:** crawlable content for the highest-value AI-landing pages + the rest of the indexable surface.
- **Changes:** render hubs (`asep`/`opsyd`/`metaptyxiaka`/`pistopoihseis`) from `GUIDED_HUB_DATA` + WP post-list links → `CollectionPage`/`ItemList`/`BreadcrumbList`; category archives; indexable static pages (`about`, `contact`, `assignments`, `asep/graptos-diagonismos`, `delta-apps`); homepage. Policy pages `noindex`. Calculators: prerender a static description, keep the tool interactive.
- **Test gate:** every `sitePolicy.json` indexable route generates; **JS-disabled** spot check shows real content; verifier + post-deploy harness; generated routes match the sitemap.
- **Commit & rollback:** merge after gate.

### Phase 5 — Structured-data depth & metadata consolidation
- **Goal:** one authoritative source of head + JSON-LD; correct indexing directives.
- **Changes:** global `Organization` ("Delta") + `WebSite` graph; per-template JSON-LD finalized; `BreadcrumbList` everywhere; filtered/search URLs `noindex,follow` + canonical to unfiltered parent; ensure react-helmet (client nav) and the injected head do **not** duplicate (single source).
- **Test gate:** Google Rich Results Test + Schema Markup Validator on one of each template; assert (build + post-deploy) exactly one of each head tag, correct canonical/robots per page type, no duplicates after the app mounts.
- **Commit & rollback:** merge after gate.

### Phase 6 — Discovery files & WP automation hardening
- **Goal:** sitemaps/RSS correct; publishing reliably triggers rebuilds.
- **Changes:** sitemap from all canonical indexable routes (real `lastmod`) + RSS; **fix the deploy plugin** (real system cron + `DISABLE_WP_CRON` *only after* the cron is confirmed; env policy = **staging-only pre-cutover, production-only post-cutover**; keep debounce). *News classification + `NewsArticle` + news-sitemap (daily GitHub-Action cron) are **deferred to post-cutover**.*
- **Test gate:** publish a test post in WP → exactly one debounced staging build → page appears crawlable; unpublish → 404; sitemaps/RSS validate.
- **Commit & rollback:** merge after gate.

### Phase 7 — Pre-cutover dress rehearsal *(the go/no-go)*
- **Goal:** prove the whole thing on staging under prod-like config; map redirects.
- **Changes:** full verification pass (no new features). Build the **reviewed legacy-redirect map** (old WP permalinks → new routes; sources from Search Console + WP sitemap; **never fuzzy** — clear equivalent → 301, broader → hub, none → 404). Confirm **Vercel Pro** + deployment-check gating preview→prod. Confirm **GA4 property match** + conversions registered + single `page_view`.
- **Test gate = the five hard cutover gates (§7), all green.** If any is red, **slip the date** — do not flip.
- **Commit & rollback:** tag the release candidate.

### Phase 8 — Production cutover *(the flip)*
- **Goal:** `deltainc.gr` becomes the React app with zero crawlability regression.
- **Changes (in order):**
  1. Move WordPress to `cms.deltainc.gr` (TLS; serialized `wp search-replace`; update Yoast image URLs; point `VITE_WP_BASE_URL`). **Acceptance: no featured-image URL still references the old host.**
  2. Set production env vars (§6), `ALLOW_INDEXING=true`.
  3. Switch the deploy hook to production-only.
  4. Point `deltainc.gr` DNS to Vercel.
  5. Legacy 301s live.
- **Test gate (post-flip, on production):** production URLs serve crawlable content; redirects 301 to correct targets; images 200; 404 correct; GA measuring; resubmit both sitemaps in Search Console; **annotate the cutover in GA4**; Facebook "Scrape Again" on key URLs.
- **Rollback:** keep WP fully operational at `cms.deltainc.gr`; if catastrophic, revert `deltainc.gr` DNS to WordPress.

### Phase 9 — Deferred (post-cutover, only if justified by results)
True SSG + hydration (RR7 framework mode or `vite-react-ssg` + data-layer refactor + the ~30 SSR-safety files) to unify render paths and remove the re-render; News SEO depth (`NewsArticle`, news-sitemap, daily cron); author `Person` pages; **i18n** when going international (subpath `/en/`, `hreflang`, per-locale sitemaps). Architecture is prepared for all of these.

---

## 9. Timeline reality vs. 2026-06-28 (~5 days)

Phases 0–8 with a gated deploy each is **aggressive** for 5 days. To hit it, the dev phases (0–6) must run **in parallel** with the editorial ACF migration. Immovable items: content + redirects + verification (the five gates). Highest slip risk: the **WP → `cms.deltainc.gr` move** and the **redirect map** (the careful, risky parts). **A clean cutover a few days late beats a broken one on time.**

| Phase | Pre-cutover? |
|---|---|
| 0 Baseline & harness | **Required** |
| 1 Robots/sitemap | **Required** |
| 2 Blog content | **Required** |
| 3 Course content | **Required** |
| 4 Hubs/static | **Required** |
| 5 Structured data | **Required** |
| 6 Discovery/automation | Minimal version required (manual rebuild OK at first) |
| 7 Rehearsal + redirects | **Required (the gate)** |
| 8 Cutover | **The flip** |
| 9 SSG / News / i18n | Deferred |

---

## 10. Open items / owners

- **Confirm GA4 property** `G-6V7M5W9LNQ` matches the live WordPress Site Kit property. — *Owner: you*
- **Editorial:** ACF migration of the 33 Elementor programs + content/slug fixes + redirect inputs. — *Owner: you / WP admin*
- **Vercel:** upgrade to Pro; grant access for env vars, deploy hooks, domains, deployment checks. — *Owner: you*
- **WordPress host move** to `cms.deltainc.gr` (DNS/TLS/`wp search-replace`/Yoast). — *Owner: you / WP admin*
