const ASEP_RSS_URL = "https://info.asep.gr/feed.xml";
const ASEP_ANNOUNCEMENTS_URL = "https://info.asep.gr/announcements-list";
const CONTEST_CATEGORY = "Διαγωνισμοί/Προκηρύξεις";

const RESPONSE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=1800, stale-while-revalidate=86400",
  "access-control-allow-origin": "*",
};

export default async function handler(request, response) {
  const url = new URL(request.url, "https://deltainc.gr");
  const limit = clampNumber(Number(url.searchParams.get("limit") || 8), 1, 12);
  const debug = url.searchParams.get("debug") === "true";

  const debugInfo = {
    rss: null,
    announcementsPage: null,
  };

  let source = ASEP_RSS_URL;
  let items = [];

  const rssResult = await fetchText(ASEP_RSS_URL, "application/rss+xml,application/xml,text/xml,*/*");
  debugInfo.rss = summarizeFetchResult(rssResult);

  if (rssResult.ok && rssResult.body) {
    items = parseRssItems(rssResult.body, limit);
  }

  if (items.length === 0) {
    source = ASEP_ANNOUNCEMENTS_URL;
    const pageResult = await fetchText(ASEP_ANNOUNCEMENTS_URL, "text/html,application/xhtml+xml,*/*");
    debugInfo.announcementsPage = summarizeFetchResult(pageResult);

    if (pageResult.ok && pageResult.body) {
      items = parseAnnouncementPageItems(pageResult.body, limit);
    }
  }

  const payload = {
    source,
    sourceName: "ΑΣΕΠ",
    sourceCategory: CONTEST_CATEGORY,
    fetchedAt: new Date().toISOString(),
    items: items.slice(0, limit),
  };

  if (debug) {
    payload.debug = debugInfo;
  }

  response.writeHead(200, RESPONSE_HEADERS);
  response.end(JSON.stringify(payload));
}

async function fetchText(url, accept) {
  try {
    const upstream = await fetch(url, {
      headers: {
        accept,
        "accept-language": "el-GR,el;q=0.9,en;q=0.7",
        "user-agent": "Mozilla/5.0 (compatible; DeltaInc/1.0; +https://deltainc.gr)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    const body = await upstream.text();
    return {
      ok: upstream.ok,
      status: upstream.status,
      contentType: upstream.headers.get("content-type") || "",
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarizeFetchResult(result) {
  return {
    ok: result.ok,
    status: result.status,
    contentType: result.contentType,
    bodyLength: result.body.length,
    containsContestText: /Διαγωνισ|Προκηρ/i.test(result.body),
    error: result.error || null,
  };
}

function parseRssItems(xml, limit) {
  const rows = Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi));
  const items = [];

  for (const row of rows) {
    if (items.length >= limit) break;

    const itemXml = row[1];
    const title = cleanText(readXmlTag(itemXml, "title"));
    const description = cleanText(readXmlTag(itemXml, "description"));
    const link = cleanText(readXmlTag(itemXml, "link"));
    const pubDate = cleanText(readXmlTag(itemXml, "pubDate"));
    const categories = Array.from(itemXml.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi))
      .map((match) => cleanText(match[1]))
      .filter(Boolean);

    const searchText = `${title} ${description} ${categories.join(" ")}`;
    if (!isRelevantContestText(searchText)) continue;

    items.push(makeItem({
      category: CONTEST_CATEGORY,
      title,
      date: pubDate,
      url: link,
    }));
  }

  return dedupeItems(items);
}

function parseAnnouncementPageItems(html, limit) {
  const rows = Array.from(html.matchAll(/<div class="views-row">([\s\S]*?)<div class="views-field views-field-nothing">/gi));
  const items = [];

  for (const row of rows) {
    if (items.length >= limit) break;

    const rowHtml = row[1];
    const category = cleanText(readMatch(rowHtml, /views-field-field-announcement-type[\s\S]*?<div class="field-content">([\s\S]*?)<\/div>/i));
    if (!isContestCategory(category)) continue;

    const title = cleanText(readMatch(rowHtml, /views-field-title[\s\S]*?<h3 class="field-content">([\s\S]*?)<\/h3>/i));
    const dateLabel = cleanText(readMatch(rowHtml, /views-field-field-issue-date[\s\S]*?<time[^>]*>([\s\S]*?)<\/time>/i));
    const datetime = cleanText(readMatch(rowHtml, /<time[^>]*datetime="([^"]*)"/i));
    const href = cleanText(readMatch(rowHtml, /views-field-view-node[\s\S]*?<a[^>]*href="([^"]*)"/i));

    if (!title || !href) continue;

    items.push(makeItem({
      category,
      title,
      date: datetime || dateLabel,
      dateLabel,
      url: absoluteAsepUrl(href),
    }));
  }

  return dedupeItems(items);
}

function makeItem({ category, title, date, dateLabel, url }) {
  const parsedDate = date ? new Date(date) : null;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime());
  const absoluteUrl = absoluteAsepUrl(url);

  return {
    id: extractNodeId(absoluteUrl) || hashString(`${title}:${absoluteUrl}`),
    category: category || CONTEST_CATEGORY,
    title,
    dateLabel: dateLabel || (validDate ? formatGreekDate(parsedDate) : ""),
    datetime: validDate ? parsedDate.toISOString() : "",
    url: absoluteUrl,
  };
}

function readXmlTag(xml, tagName) {
  return readMatch(xml, new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
}

function readMatch(value, pattern) {
  const match = value.match(pattern);
  return match ? match[1] : "";
}

function cleanText(value) {
  return decodeEntities(String(value || ""))
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

function isContestCategory(category) {
  return /Διαγωνισ/i.test(category) && /Προκηρ/i.test(category);
}

function isRelevantContestText(text) {
  return /Διαγωνισ|Προκήρυξη|Προκηρύξεις|προκήρυξης|[0-9]+[ΚΓ][Α-Ω]?\/20[0-9]{2}|ΠΔΑ\/20[0-9]{2}/i.test(text);
}

function absoluteAsepUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://info.asep.gr/${url.replace(/^\/+/, "")}`;
}

function extractNodeId(url) {
  const match = url.match(/node\/(\d+)/);
  return match ? match[1] : "";
}

function dedupeItems(items) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function formatGreekDate(date) {
  return new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `asep-${Math.abs(hash)}`;
}
