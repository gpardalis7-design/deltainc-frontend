import { parse } from "node-html-parser";
import {
  ARTICLE_TOC_MARKER,
  ARTICLE_TOC_ROOT_ATTRIBUTE,
  transformArticleTocTree,
} from "../src/app/lib/articleTocCore.mjs";

const nodeAdapter = {
  children: (node) => Array.from(node.childNodes || []),
  parent: (node) => node.parentNode || null,
  isElement: (node) => node.nodeType === 1,
  isText: (node) => node.nodeType === 3,
  tagName: (node) => typeof node.rawTagName === "string" ? node.rawTagName.toLowerCase() : "",
  classNames: (node) => String(node.getAttribute?.("class") || "").split(/\s+/).filter(Boolean),
  text: (node) => node.textContent || "",
  hasAttribute: (node, name) => typeof node.hasAttribute === "function" && node.hasAttribute(name),
  getAttribute: (node, name) => node.getAttribute?.(name) ?? null,
  setAttribute: (node, name, value) => node.setAttribute?.(name, value),
  createPlaceholder: () => parse(`<div ${ARTICLE_TOC_ROOT_ATTRIBUTE}></div>`).firstChild,
  replace: (node, replacement) => node.replaceWith(replacement),
  remove: (node) => node.remove(),
  serialize: (root) => root.toString(),
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function prepareArticleForToc(post) {
  const content = post?.content?.rendered || "";
  if (!content.includes(ARTICLE_TOC_MARKER) && !content.includes(ARTICLE_TOC_ROOT_ATTRIBUTE)) {
    return { post, toc: null };
  }

  const root = parse(content, { comment: false });
  const result = transformArticleTocTree(root, nodeAdapter);
  if (!result.hasToc) return { post: { ...post, content: { ...post.content, rendered: result.html } }, toc: null };

  return {
    post: { ...post, content: { ...post.content, rendered: result.html } },
    toc: result.headings,
  };
}

export function renderStaticArticleToc(headings) {
  if (!headings?.length) return "";
  const items = headings.map((heading) => {
    const children = heading.children.length
      ? `<ul>${heading.children.map((child) => `<li><a href="#${escapeHtml(child.id)}">${escapeHtml(child.text)}</a></li>`).join("")}</ul>`
      : "";
    return `<li><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>${children}</li>`;
  }).join("");

  return `<nav class="article-toc-static" aria-label="Περιεχόμενα άρθρου"><p><strong>Περιεχόμενα άρθρου</strong></p><ol>${items}</ol></nav>`;
}

export function insertStaticArticleToc(contentHtml, headings) {
  if (!headings?.length) return contentHtml;
  const root = parse(contentHtml, { comment: false });
  const placeholder = root.querySelector(`[${ARTICLE_TOC_ROOT_ATTRIBUTE}]`);
  if (!placeholder) return contentHtml;
  placeholder.replaceWith(parse(renderStaticArticleToc(headings)).firstChild);
  return root.toString();
}
