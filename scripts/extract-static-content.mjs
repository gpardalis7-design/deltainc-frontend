import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Extract the static-page title/description/path entries from seo.ts's
// staticPageSeo `pages` object (plain string literals — read from source so we
// don't duplicate or compile TS; regenerated each build → no drift).

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEO_PATH = resolve(__dirname, "../src/app/lib/seo.ts");

export function extractStaticPages() {
  const text = readFileSync(SEO_PATH, "utf8");
  const block = /const pages = \{([\s\S]*?)\n {2}\};/.exec(text);
  if (!block) return {};
  const pages = {};
  const entryRe =
    /(\w+):\s*\{\s*title:\s*"((?:[^"\\]|\\.)*)",\s*description:\s*"((?:[^"\\]|\\.)*)",\s*path:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = entryRe.exec(block[1]))) {
    pages[m[1]] = {
      title: m[2].replace(/\\"/g, '"'),
      description: m[3].replace(/\\"/g, '"'),
      path: m[4],
    };
  }
  return pages;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [key, p] of Object.entries(extractStaticPages())) {
    console.log(`${key}: path=${p.path} title="${p.title.slice(0, 40)}" desc=${p.description.length}c`);
  }
}
