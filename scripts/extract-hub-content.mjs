import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Extract the crawlable string fields (name/h1/intro/keyTopics) for each guided
// hub directly from guidedHubConfig.tsx. The config is .tsx with JSX icons so it
// can't be imported in Node — but the crawlable content is plain string literals,
// so we read them from source (regenerated every build → no drift, no duplication).

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../src/app/lib/hubs/guidedHubConfig.tsx");
const HUB_SLUGS = ["opsyd", "asep", "metaptyxiaka", "pistopoihseis"];

function hubBlock(text, slug) {
  // Top-level hub keys are at 2-space indent: `\n  <slug>: {`.
  const start = new RegExp(`\\n {2}${slug}:\\s*\\{`).exec(text);
  if (!start) return "";
  const rest = text.slice(start.index + start[0].length);
  // Block ends at the next top-level key (`\n  word: {`) or the object close.
  const end = /\n {2}[a-z]+:\s*\{|\n\};/.exec(rest);
  return end ? rest.slice(0, end.index) : rest;
}

function field(block, name) {
  const m = new RegExp(`${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(block);
  return m ? m[1].replace(/\\"/g, '"') : "";
}

export function extractHubContent() {
  const text = readFileSync(CONFIG_PATH, "utf8");
  const hubs = {};
  for (const slug of HUB_SLUGS) {
    const block = hubBlock(text, slug);
    if (!block) continue;
    // keyTopics live before infoPanels/faq — restrict the label/desc scan to that region.
    const ktStart = block.indexOf("keyTopics:");
    const ktEndIdx = ["infoPanels:", "faq:", "relatedHubs:"]
      .map((k) => block.indexOf(k))
      .filter((i) => i > ktStart)
      .sort((a, b) => a - b)[0];
    const ktRegion = ktStart !== -1 ? block.slice(ktStart, ktEndIdx ?? block.length) : "";
    const keyTopics = [];
    const ktRe = /label:\s*"((?:[^"\\]|\\.)*)",\s*desc:\s*"((?:[^"\\]|\\.)*)"/g;
    let km;
    while ((km = ktRe.exec(ktRegion))) keyTopics.push({ label: km[1], desc: km[2] });
    hubs[slug] = {
      slug,
      name: field(block, "name"),
      h1: field(block, "h1"),
      intro: field(block, "intro"),
      keyTopics,
    };
  }
  return hubs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hubs = extractHubContent();
  for (const [slug, h] of Object.entries(hubs)) {
    console.log(`${slug}: name="${h.name}" h1=${h.h1.length}c intro=${h.intro.length}c keyTopics=${h.keyTopics.length}`);
  }
}
