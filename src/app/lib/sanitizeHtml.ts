import DOMPurify, { type Config } from "dompurify";

const RICH_HTML_SANITIZE_OPTIONS: Config = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["iframe"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "frameborder",
    "loading",
    "referrerpolicy",
    "sandbox",
    "scrolling",
    "target",
  ],
};

export function sanitizeRichHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  return DOMPurify.sanitize(trimmed, RICH_HTML_SANITIZE_OPTIONS);
}
