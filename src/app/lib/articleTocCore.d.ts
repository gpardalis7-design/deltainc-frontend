export interface ArticleTocChild {
  id: string;
  text: string;
}

export interface ArticleTocHeading {
  id: string;
  text: string;
  children: ArticleTocChild[];
}

export interface ArticleTocResult {
  hasToc: boolean;
  headings: ArticleTocHeading[];
  html: string;
}

export interface ArticleTocTreeAdapter<NodeType = unknown> {
  children(node: NodeType): NodeType[];
  parent(node: NodeType): NodeType | null;
  isElement(node: NodeType): boolean;
  isText(node: NodeType): boolean;
  tagName(node: NodeType): string;
  classNames(node: NodeType): string[];
  text(node: NodeType): string;
  hasAttribute(node: NodeType, name: string): boolean;
  getAttribute(node: NodeType, name: string): string | null;
  setAttribute(node: NodeType, name: string, value: string): void;
  createPlaceholder(): NodeType;
  replace(node: NodeType, replacement: NodeType): void;
  remove(node: NodeType): void;
  serialize(root: NodeType): string;
}

export const ARTICLE_TOC_MARKER: "[delta_toc]";
export const ARTICLE_TOC_ROOT_ATTRIBUTE: "data-delta-toc-root";
export function transformArticleTocTree<NodeType>(
  root: NodeType,
  adapter: ArticleTocTreeAdapter<NodeType>,
): ArticleTocResult;
