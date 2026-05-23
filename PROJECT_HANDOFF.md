# Delta Inc Frontend Handoff

## Project
- Path: `/Users/macbook/Desktop/test/DELTAINC-2`
- Stack: React + Vite + TypeScript
- Purpose: Delta Inc education platform with homepage, service hubs, editorial hubs, blog, article pages, courses/programs, and contact flows.

## Current Visual Direction
- Premium, trustworthy, modern
- Main palette direction: clean editorial blue
- Layouts have generally been widened toward `max-w-7xl`
- Homepage and hub body sections use shared surface/background presets
- Main hub hero sections intentionally stay dark blue

## Core UX Rules Already Decided
- Main 4 hubs are guided/service hubs:
  - `/asep`
  - `/opsyd`
  - `/metaptyxiaka`
  - `/pistopoihseis`
- Editorial hubs are a lighter editorial variant and should not behave exactly like the main 4 service hubs
- Article chips:
  - show on non-hub pages
  - do not show on hub pages (service or editorial)
- Newsletter behavior:
  - footer button can open the newsletter popup manually, including on `/contact`
  - auto-popup rules remain more restricted
- Programs:
  - fake frontend program fallback has been removed
  - program requests use a longer timeout because the live WP endpoint is slow

## Important Recent Technical Changes
- Shared article label logic added:
  - `src/app/lib/articleLabels.ts`
- Shared article UI cleanup has started:
  - `src/app/components/articles/ArticleLabelChip.tsx`
  - `src/app/components/articles/ArticleCardFooter.tsx`
  - `src/app/components/articles/StackedArticleCard.tsx`
  - `src/app/components/articles/ProminentArticleCard.tsx`
  - `src/app/components/articles/FeaturedOverlayArticleCard.tsx`
  - `src/app/components/articles/CompactArticleListItem.tsx`
- Shared surface presets live in:
  - `src/app/Root.tsx`
- Newsletter manual-open fix on `/contact` lives in:
  - `src/app/components/NewsletterSlideIn.tsx`
- Program live-source handling lives in:
  - `src/app/lib/deltaApi.ts`
  - `src/app/pages/Courses.tsx`
  - `src/app/pages/ProgramDetails.tsx`

## Known Data / Content Facts
- WordPress program data exists in the `program` custom post type
- Program pages currently normalize and use:
  - `title.rendered`
  - `excerpt.rendered`
  - `content.rendered`
  - taxonomies for level/category/university/mode/city/uni type
  - `acf.*` or `meta.*` fields for:
    - `tuition`
    - `duration`
    - `language`
    - `deadline`
    - `is_featured`
    - `overview`
    - `curriculum`
    - `admissions`
    - `outcomes`
    - `faq`
- Current program detail pages feel thin because they rely mostly on structured section fields, while `contentHtml` is not yet used as a strong main-body fallback

## Known Technical Risks / Notes
- There is no strong automated lint/test layer; rely on build checks often
- Build command used successfully:
  - `PATH=/Users/macbook/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/macbook/Desktop/test/.pnpm/pnpm build`
- Local dev server commonly runs at:
  - `http://127.0.0.1:4173/`
- The live WP `program` endpoint is real but slow, especially with:
  - `per_page=9&_embed=1`

## Still Worth Improving
- Better use of real WordPress content in program detail pages
- Further optimization of `/courses` request weight and performance
- Continue centralizing repeated article UI where safe
- Strengthen structured content strategy for programs and editorial content

## Suggested New-Chat Prompt
```text
This is the duplicated Delta Inc frontend project. Please inspect the codebase first and continue from the current implemented state rather than redesigning from scratch.

Key context:
- premium / trustworthy / modern direction
- clean editorial blue palette
- homepage + hub body sections use shared surface presets
- hub hero sections stay dark blue
- article chips show on non-hub pages only
- newsletter footer button can open on /contact
- programs no longer use fake fallback data
- program fetches have a longer timeout because the live WP endpoint is slow
- article UI has already been partially centralized into shared components
```
