import { RefObject, useEffect } from "react";

const TABLE_WRAPPER_SELECTOR = ".rich-table-scroll, .TyagGW_tableContainer, .TyagGW_tableWrapper, .wp-block-table";

function wrapScrollableTables(root: HTMLElement) {
  const tables = root.querySelectorAll("table");

  tables.forEach((table) => {
    if (!(table instanceof HTMLTableElement)) return;
    if (table.closest(TABLE_WRAPPER_SELECTOR)) return;

    const wrapper = document.createElement("div");
    wrapper.className = "rich-table-scroll";
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

export function useScrollableRichTables(
  rootRef: RefObject<HTMLElement | null>,
  deps: ReadonlyArray<unknown>
) {
  useEffect(() => {
    if (!rootRef.current) return;
    wrapScrollableTables(rootRef.current);
  }, [rootRef, ...deps]);
}
