import {
  ARTICLE_TOC_MARKER,
  ARTICLE_TOC_ROOT_ATTRIBUTE,
  transformArticleTocTree,
  type ArticleTocResult,
  type ArticleTocTreeAdapter,
} from "./articleTocCore.mjs";

const EMPTY_RESULT: ArticleTocResult = { hasToc: false, headings: [], html: "" };

const browserAdapter: ArticleTocTreeAdapter<Node> = {
  children: (node) => Array.from(node.childNodes),
  parent: (node) => node.parentNode,
  isElement: (node) => node.nodeType === Node.ELEMENT_NODE,
  isText: (node) => node.nodeType === Node.TEXT_NODE,
  tagName: (node) => node instanceof Element ? node.tagName.toLowerCase() : "",
  classNames: (node) => node instanceof Element ? Array.from(node.classList) : [],
  text: (node) => node.textContent || "",
  hasAttribute: (node, name) => node instanceof Element && node.hasAttribute(name),
  getAttribute: (node, name) => node instanceof Element ? node.getAttribute(name) : null,
  setAttribute: (node, name, value) => {
    if (node instanceof Element) node.setAttribute(name, value);
  },
  createPlaceholder: () => {
    const placeholder = document.createElement("div");
    placeholder.setAttribute(ARTICLE_TOC_ROOT_ATTRIBUTE, "");
    return placeholder;
  },
  replace: (node, replacement) => node.replaceWith(replacement),
  remove: (node) => node.remove(),
  serialize: (root) => root instanceof HTMLElement ? root.innerHTML : "",
};

export function prepareArticleTocHtml(html: string): ArticleTocResult {
  if (!html) return EMPTY_RESULT;
  if (!html.includes(ARTICLE_TOC_MARKER) && !html.includes(ARTICLE_TOC_ROOT_ATTRIBUTE)) {
    return { ...EMPTY_RESULT, html };
  }

  const documentRoot = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
  const result = transformArticleTocTree(documentRoot, browserAdapter);
  return result.hasToc ? result : { ...result, html: result.html || html };
}
