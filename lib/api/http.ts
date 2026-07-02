import axios from "axios";

/**
 * Shared axios instance for all client-side data access.
 * Same-origin, JSON by default. Axios rejects on non-2xx responses,
 * so callers can rely on thrown errors (with `error.response?.status`)
 * instead of manual `res.ok` checks.
 */
export const http = axios.create({
  headers: { "Content-Type": "application/json" },
});

/** Per-tab in-memory ETag+body cache, keyed by URL, used to short-circuit 304s. */
const etagCache = new Map<string, { etag: string; body: unknown }>();

/** GET a URL and return the parsed JSON body. Honors server-side 304 (ETag) responses. */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const hit = etagCache.get(url);
  const res = await http.get<T>(url, {
    signal,
    headers: hit ? { "If-None-Match": hit.etag } : undefined,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });
  if (res.status === 304 && hit) return hit.body as T;
  const etag = res.headers["etag"];
  if (etag) etagCache.set(url, { etag, body: res.data });
  return res.data;
}
