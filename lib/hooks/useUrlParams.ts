import { useRouter } from "next/router";
import { useCallback } from "react";

export function useUrlParams() {
  const router = useRouter();
  const get = (k: string) => (typeof router.query[k] === "string" ? (router.query[k] as string) : undefined);
  const set = useCallback((updates: Record<string, string | null | undefined>) => {
    const q: Record<string, string> = {};
    for (const [k, v] of Object.entries(router.query)) if (typeof v === "string") q[k] = v;
    for (const [k, v] of Object.entries(updates)) { if (v == null || v === "") delete q[k]; else q[k] = v; }
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  }, [router]);
  return { get, set, ready: router.isReady };
}
