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

/** GET a URL and return the parsed JSON body. */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await http.get<T>(url, { signal });
  return res.data;
}
