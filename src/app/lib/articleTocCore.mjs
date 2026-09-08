export const ARTICLE_TOC_MARKER = "[delta_toc]";
export const ARTICLE_TOC_ROOT_ATTRIBUTE = "data-delta-toc-root";

const EXCLUDED_ANCESTOR_TAGS = new Set([
  "blockquote",
  "button",
  "code",
  "figure",
  "nav",
  "pre",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
]);
const EXCLUDED_ANCESTOR_CLASSES = new Set(["callout", "delta-newsletter-cta"]);

function normalizeMarkerText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headingSlug(value) {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR")
    .replace(/&/g, " kai ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "enotita";
}

function walk(root, adapter) {
  const nodes = [];
  const visit = (node) => {
    nodes.push(node);
    for (const child of adapter.children(node)) visit(child);
  };
  for (const child of adapter.children(root)) visit(child);
  return nodes;
}

function hasExcludedAncestor(node, adapter) {
  let parent = adapter.parent(node);
  while (parent) {
    const tag = adapter.tagName(parent);
    if (tag && EXCLUDED_ANCESTOR_TAGS.has(tag)) return true;
    for (const className of adapter.classNames(parent)) {
      if (EXCLUDED_ANCESTOR_CLASSES.has(className)) return true;
    }
    parent = adapter.parent(parent);
  }
  return false;
}

function containsExcludedMarkerContent(node, adapter) {
  const descendants = walk(node, adapter);
  return descendants.some((descendant) => {
    const tag = adapter.tagName(descendant);
    return tag === "code" || tag === "pre";
  });
}

function markerCandidate(node, adapter) {
  if (hasExcludedAncestor(node, adapter)) return null;

  if (adapter.isElement(node)) {
    if (adapter.hasAttribute(node, ARTICLE_TOC_ROOT_ATTRIBUTE)) return node;
    const tag = adapter.tagName(node);
    if ((tag === "p" || tag === "div") &&
        !containsExcludedMarkerContent(node, adapter) &&
        normalizeMarkerText(adapter.text(node)) === ARTICLE_TOC_MARKER) {
      return node;
    }
    return null;
  }

  if (!adapter.isText(node) || normalizeMarkerText(adapter.text(node)) !== ARTICLE_TOC_MARKER) {
    return null;
  }

  const parent = adapter.parent(node);
  if (parent && markerCandidate(parent, adapter) === parent) return null;
  return node;
}

function uniqueId(preferred, usedIds) {
  const base = preferred || "enotita";
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

/**
 * Mutates an adapter-backed HTML tree only when it contains a valid opt-in
 * marker. Marker discovery, eligibility, hierarchy and ID generation live here
 * so the browser and build-time adapters cannot develop different rules.
 */
export function transformArticleTocTree(root, adapter) {
  const nodes = walk(root, adapter);
  const markers = [];

  for (const node of nodes) {
    const candidate = markerCandidate(node, adapter);
    if (candidate && !markers.includes(candidate)) markers.push(candidate);
  }

  if (markers.length === 0) {
    return { hasToc: false, headings: [], html: adapter.serialize(root) };
  }

  const headingNodes = nodes.filter((node) => {
    if (!adapter.isElement(node) || hasExcludedAncestor(node, adapter)) return false;
    const tag = adapter.tagName(node);
    return tag === "h2" || tag === "h3";
  });

  const usedIds = new Set();
  for (const node of nodes) {
    if (!adapter.isElement(node) || headingNodes.includes(node)) continue;
    const id = adapter.getAttribute(node, "id")?.trim();
    if (id) usedIds.add(id);
  }

  const headings = [];
  let currentH2 = null;

  for (const node of headingNodes) {
    const text = normalizeMarkerText(adapter.text(node));
    if (!text) continue;

    const existingId = adapter.getAttribute(node, "id")?.trim() || "";
    const id = uniqueId(existingId || `enotita-${headingSlug(text)}`, usedIds);
    adapter.setAttribute(node, "id", id);

    if (adapter.tagName(node) === "h2") {
      currentH2 = { id, text, children: [] };
      headings.push(currentH2);
    } else if (currentH2) {
      currentH2.children.push({ id, text });
    }
  }

  if (headings.length === 0) {
    for (const marker of markers) adapter.remove(marker);
    return { hasToc: false, headings: [], html: adapter.serialize(root) };
  }

  const firstMarker = markers[0];
  if (!adapter.hasAttribute(firstMarker, ARTICLE_TOC_ROOT_ATTRIBUTE)) {
    adapter.replace(firstMarker, adapter.createPlaceholder());
  }
  for (const marker of markers.slice(1)) adapter.remove(marker);

  return { hasToc: true, headings, html: adapter.serialize(root) };
}
