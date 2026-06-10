export type FetchWithHeadersResult = { data: unknown; headers: Headers } | null;

export const WP_BASE_URL = import.meta.env.VITE_WP_BASE_URL || "https://deltainc.gr";
export const ENABLE_MOCK_FALLBACKS =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_FALLBACKS === "true";

export const WP_API = `${WP_BASE_URL}/wp-json/wp/v2`;

export async function tryFetch<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function tryFetchWithHeaders(
  url: string,
  timeoutMs = 8000
): Promise<FetchWithHeadersResult> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const data = await res.json();
    return { data, headers: res.headers };
  } catch {
    return null;
  }
}

export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}
