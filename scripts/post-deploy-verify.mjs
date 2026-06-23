#!/usr/bin/env node
/**
 * Post-deploy verification harness (GEO/SSG plan §4).
 *
 * Runs against a *deployed* URL (a Vercel preview, or production at cutover) —
 * the only place that can test real routing, header behavior, image
 * reachability, and (via Playwright) console/hydration warnings.
 *
 * Two layers:
 *   - curl  : headers / HTML / status codes / og:image reachability / routing.
 *   - Playwright (optional): console + React hydration warnings on a real load.
 *     If Playwright is not installed, that layer is SKIPPED, not failed, so the
 *     curl layer is usable everywhere. Later phases (2+) make it required.
 *
 * Checks are tiered: `required` failures exit non-zero; informational ones WARN.
 * Later phases extend CHECKS (article body + JSON-LD, course schema, etc.).
 *
 * Usage:
 *   node scripts/post-deploy-verify.mjs --url https://test.deltainc.gr [options]
 *   TARGET_URL=https://test.deltainc.gr node scripts/post-deploy-verify.mjs
 *
 * Options:
 *   --url <base>        Base URL to verify (or first positional arg, or TARGET_URL).
 *   --ua <string>       User-Agent for crawler-view fetches (default: facebookexternalhit).
 *   --expect-noindex    Require X-Robots-Tag: noindex (staging). Default: off.
 *   --no-playwright     Skip the Playwright layer entirely.
 *   --bypass-token <t>  Vercel "Protection Bypass for Automation" secret, so the
 *                       harness can fetch a protected preview (sent as the
 *                       x-vercel-protection-bypass header). Falls back to
 *                       env VERCEL_AUTOMATION_BYPASS_SECRET.
 */

import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--url") args.url = argv[++i];
    else if (token === "--ua") args.ua = argv[++i];
    else if (token === "--expect-noindex") args.expectNoindex = true;
    else if (token === "--no-playwright") args.noPlaywright = true;
    else if (token === "--bypass-token") args.bypassToken = argv[++i];
    else if (token === "--article-slug") args.articleSlug = argv[++i];
    else if (token.startsWith("--")) throw new Error(`Unknown flag: ${token}`);
    else args.positional.push(token);
  }
  return args;
}

const cli = parseArgs(process.argv.slice(2));
const RAW_BASE = cli.url || cli.positional[0] || process.env.TARGET_URL;

if (!RAW_BASE) {
  console.error("Error: no target URL. Pass --url <base>, a positional arg, or set TARGET_URL.");
  process.exit(2);
}

const BASE = RAW_BASE.replace(/\/+$/, "");
const CRAWLER_UA =
  cli.ua ||
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const EXPECT_NOINDEX = Boolean(cli.expectNoindex);
const USE_PLAYWRIGHT = !cli.noPlaywright;
const BYPASS_TOKEN = cli.bypassToken || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";
const ARTICLE_SLUG = cli.articleSlug || process.env.ARTICLE_SLUG || "";
const HOME_TITLE_PREFIX = "Delta | Εκπαίδευση";

// ---------------------------------------------------------------------------
// curl helpers
// ---------------------------------------------------------------------------

function curl(path, { method = "GET", ua = CRAWLER_UA, followRedirects = false } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const curlArgs = [
    "-sS",
    "-o",
    method === "HEAD" ? "/dev/null" : "-",
    "-D",
    "-", // dump response headers to stdout
    "-w",
    "\n__HTTP_STATUS__:%{http_code}\n__CONTENT_TYPE__:%{content_type}\n",
    "-A",
    ua,
    "--connect-timeout",
    "10",
    "--max-time",
    "45",
  ];
  if (BYPASS_TOKEN) {
    curlArgs.push("-H", `x-vercel-protection-bypass: ${BYPASS_TOKEN}`);
    curlArgs.push("-H", "x-vercel-set-bypass-cookie: true");
  }
  if (method === "HEAD") curlArgs.push("-I");
  if (followRedirects) curlArgs.push("-L");
  curlArgs.push(url);

  let raw;
  try {
    raw = execFileSync("curl", curlArgs, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return { error: error.message || String(error), status: 0, headers: {}, body: "", contentType: "" };
  }

  const statusMatch = raw.match(/__HTTP_STATUS__:(\d+)/);
  const ctMatch = raw.match(/__CONTENT_TYPE__:([^\n]*)/);
  const status = statusMatch ? Number(statusMatch[1]) : 0;
  const contentType = ctMatch ? ctMatch[1].trim() : "";

  // Strip the trailing -w marker block to leave header dump + body.
  const cleaned = raw.replace(/\n?__HTTP_STATUS__:[\s\S]*$/, "");
  // The last header block precedes the body (separated by a blank line). With
  // redirects there can be multiple header blocks; keep the final one.
  const splitIdx = cleaned.lastIndexOf("\r\n\r\n") !== -1
    ? cleaned.lastIndexOf("\r\n\r\n")
    : cleaned.lastIndexOf("\n\n");
  const headerBlob = splitIdx === -1 ? cleaned : cleaned.slice(0, splitIdx);
  const body = method === "HEAD" || splitIdx === -1 ? "" : cleaned.slice(splitIdx).replace(/^\s+/, "");

  const headers = {};
  for (const line of headerBlob.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);
    if (m) headers[m[1].toLowerCase()] = m[2];
  }

  return { status, contentType, headers, body, error: null };
}

function extractMeta(html, property) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  // attribute order can be reversed
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

// Returns the Allow/Disallow rule lines (lowercased) for a robots.txt group whose
// User-agent matches `ua` exactly, or null if the UA has no explicit group (it
// then falls under `User-agent: *`). Assumes one UA per group.
function robotsRulesForUA(text, ua) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) =>
    new RegExp(`^\\s*user-agent:\\s*${ua}\\s*$`, "i").test(l),
  );
  if (start === -1) return null;
  const rules = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const l = lines[i].trim();
    if (l === "" || /^user-agent:/i.test(l)) break;
    if (/^(dis)?allow:/i.test(l)) rules.push(l.toLowerCase());
  }
  return rules;
}

function uaBlocked(rules) {
  return Array.isArray(rules) && rules.some((r) => /^disallow:\s*\/\s*$/.test(r));
}

// ---------------------------------------------------------------------------
// Check registry
// ---------------------------------------------------------------------------

const results = [];
function record(name, ok, { required = true, detail = "" } = {}) {
  results.push({ name, ok, required, detail });
  const tag = ok ? "PASS" : required ? "FAIL" : "WARN";
  console.log(`  [${tag}] ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

function runCurlChecks() {
  console.log(`\ncurl checks against ${BASE} (UA: ${CRAWLER_UA.split("/")[0]})`);

  // 1. Homepage reachable + HTML.
  const home = curl("/", { followRedirects: true });
  record(
    "homepage returns 200 text/html",
    home.status === 200 && /text\/html/i.test(home.contentType),
    { detail: home.error || `status ${home.status}, ${home.contentType || "no content-type"}` },
  );

  // 2. og:image present and reachable (200 + image/*).
  const ogImage = home.body ? extractMeta(home.body, "og:image") : null;
  if (!ogImage) {
    record("og:image present in homepage HTML", false, { detail: "no og:image meta found" });
  } else {
    const img = curl(ogImage, { method: "HEAD", followRedirects: true });
    record(
      "og:image reachable (200 image/*)",
      img.status === 200 && /^image\//i.test(img.contentType),
      { detail: `${ogImage} → ${img.error || `status ${img.status}, ${img.contentType || "no content-type"}`}` },
    );
  }

  // 3. Routing — a known SPA route serves 200 (shell or injected page).
  const route = curl("/delta-apps", { followRedirects: true });
  record(
    "known route /delta-apps returns 200",
    route.status === 200,
    { detail: route.error || `status ${route.status}` },
  );

  // 4. Routing — the server-level 404 contract that holds today: an unknown
  //    /category/* segment returns a hard 404 (vercel.json route rule).
  //    Note: unknown /blog/* and /courses/* become 404 in Phases 2–3 (once the
  //    per-route static files exist); arbitrary top-level paths resolve to the
  //    SPA shell at 200 by design (catch-all rewrite to index.html).
  const unknownCategory = curl("/category/__no-such-category-geossg__", { followRedirects: false });
  record(
    "unknown /category/* returns 404",
    unknownCategory.status === 404,
    { detail: unknownCategory.error || `status ${unknownCategory.status}` },
  );

  // 4b. By-design: an arbitrary top-level path resolves to the SPA shell (200).
  const spaShell = curl("/__arbitrary_top_level_geossg__", { followRedirects: false });
  record(
    "arbitrary top-level path serves SPA shell (200, by design)",
    spaShell.status === 200,
    { required: false, detail: spaShell.error || `status ${spaShell.status}` },
  );

  // 5. Staging noindex (informational unless --expect-noindex).
  const robots = (home.headers["x-robots-tag"] || "").toLowerCase();
  record(
    "X-Robots-Tag: noindex (staging)",
    robots.includes("noindex"),
    { required: EXPECT_NOINDEX, detail: robots ? `x-robots-tag: ${robots}` : "header absent" },
  );
}

function runRobotsChecks() {
  console.log("\nrobots.txt + sitemap checks");

  const robots = curl("/robots.txt", { followRedirects: true });
  const okRobots = record(
    "robots.txt returns 200 text/plain",
    robots.status === 200 && /text\/plain/i.test(robots.contentType),
    { detail: robots.error || `status ${robots.status}, ${robots.contentType || "no content-type"}` },
  );

  if (okRobots && robots.body) {
    const body = robots.body;

    record(
      "robots.txt references Sitemap on canonical host",
      /^\s*sitemap:\s*https:\/\/deltainc\.gr\/sitemap\.xml\s*$/im.test(body),
      { detail: (body.match(/sitemap:.*/i) || ["(none)"])[0].trim() },
    );

    // Answer-engine bots must have an explicit group and not be blocked.
    for (const ua of ["OAI-SearchBot", "PerplexityBot", "Claude-User"]) {
      const rules = robotsRulesForUA(body, ua);
      record(
        `answer-engine bot allowed: ${ua}`,
        rules !== null && !uaBlocked(rules),
        { detail: rules === null ? "no explicit group" : rules.join("; ") || "(no rule)" },
      );
    }

    // Training bots must be explicitly blocked.
    for (const ua of ["GPTBot", "CCBot", "Google-Extended"]) {
      const rules = robotsRulesForUA(body, ua);
      record(
        `training bot blocked: ${ua}`,
        uaBlocked(rules),
        { detail: rules === null ? "MISSING group" : rules.join("; ") },
      );
    }
  }

  const sitemap = curl("/sitemap.xml", { followRedirects: true });
  const okSitemap = sitemap.status === 200 && /xml/i.test(sitemap.contentType);
  record(
    "sitemap.xml returns 200 xml",
    okSitemap,
    { detail: sitemap.error || `status ${sitemap.status}, ${sitemap.contentType || "no content-type"}` },
  );
  if (okSitemap && sitemap.body) {
    record(
      "sitemap uses canonical host in <loc>",
      /<loc>https:\/\/deltainc\.gr\//i.test(sitemap.body),
      { detail: (sitemap.body.match(/<loc>[^<]*<\/loc>/i) || ["(none)"])[0] },
    );
  }
}

// Phase 2: a blog route must serve its real <h1> + body + Article JSON-LD in the
// raw (pre-JS) HTML — not a skeleton, not the homepage shell.
function runArticleChecks(slug) {
  console.log(`\nblog article injection checks (/blog/${slug})`);

  const res = curl(`/blog/${encodeURI(slug)}`, { followRedirects: true });
  const ok = record(
    `article /blog/${slug} returns 200 html`,
    res.status === 200 && /text\/html/i.test(res.contentType),
    { detail: res.error || `status ${res.status}, ${res.contentType || "no content-type"}` },
  );
  if (!ok || !res.body) return;
  const body = res.body;

  const h1 = (body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]*>/g, "").trim() || "";
  record("article has a non-empty <h1>", h1.length > 0, { detail: h1 ? `“${h1.slice(0, 56)}”` : "none" });

  const title = (body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || "";
  record(
    "per-route file served (title is not the homepage)",
    title.length > 0 && !title.startsWith(HOME_TITLE_PREFIX),
    { detail: `“${title.slice(0, 56)}”` },
  );

  const hasBodyClass = /class="article-body"/.test(body);
  const textLen = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
  record(
    "real body injected (article-body + substantial text)",
    hasBodyClass && textLen > 1500,
    { detail: `article-body=${hasBodyClass}, ~${textLen} chars visible text` },
  );

  const ldBlocks = body.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  record(
    "Article (BlogPosting) JSON-LD present",
    ldBlocks.some((b) => /"@type"\s*:\s*"BlogPosting"/.test(b)),
    { detail: `${ldBlocks.length} ld+json block(s)` },
  );

  record("not a loading skeleton", !/animate-pulse/.test(body), {
    detail: /animate-pulse/.test(body) ? "skeleton markup present" : "no skeleton",
  });

  record("embedded post data present for client re-render", /id="__DELTA_BLOG_POST__"/.test(body), {
    required: false,
  });
}

async function runPlaywrightCheck() {
  if (!USE_PLAYWRIGHT) {
    console.log("\nPlaywright check: skipped (--no-playwright).");
    return;
  }
  console.log("\nPlaywright check (console + hydration warnings)");

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log(
      "  [SKIP] Playwright not installed — console/hydration layer scaffolded but inactive.\n" +
        "         Enable with: pnpm add -D playwright && npx playwright install chromium",
    );
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const problems = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" || /hydrat|did not match|Warning:/i.test(text)) {
        problems.push(`${msg.type()}: ${text}`);
      }
    });
    page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));

    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 45000 });
    record(
      "zero console errors / hydration warnings on homepage",
      problems.length === 0,
      { detail: problems.length ? problems.slice(0, 5).join(" | ") : "clean" },
    );
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Post-deploy verification — target: ${BASE}`);
  runCurlChecks();
  runRobotsChecks();
  if (ARTICLE_SLUG) runArticleChecks(ARTICLE_SLUG);
  await runPlaywrightCheck();

  const failed = results.filter((r) => !r.ok && r.required);
  const warned = results.filter((r) => !r.ok && !r.required);
  console.log(
    `\nSummary: ${results.filter((r) => r.ok).length} passed, ` +
      `${failed.length} failed, ${warned.length} warnings.`,
  );

  if (failed.length) {
    console.error(`\n✗ Post-deploy verification FAILED (${failed.length} required check(s)).`);
    process.exit(1);
  }
  console.log("\n✓ Post-deploy verification passed (required checks).");
}

main().catch((error) => {
  console.error(`\n✗ Harness error: ${error.message || error}`);
  process.exit(1);
});
