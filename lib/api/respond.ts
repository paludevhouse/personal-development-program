import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { getVersions } from "../db/versions";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;

interface MethodsOptions {
  etag?: { GET?: string[] };
}

export function methods(map: Partial<Record<Method, Handler>>, options?: MethodsOptions): NextApiHandler {
  return async (req, res) => {
    const method = (req.method ?? "GET") as Method;
    const etagCols = method === "GET" ? options?.etag?.GET : undefined;

    if (etagCols) {
      const tag = 'W/"' + (await getVersions(etagCols)) + '"';
      res.setHeader("Cache-Control", "private, no-cache");
      res.setHeader("ETag", tag);
      if (req.headers["if-none-match"] === tag) {
        res.status(304).end();
        return;
      }
    } else {
      res.setHeader("Cache-Control", "no-store");
    }

    const fn = map[method];
    if (!fn) { res.status(405).json({ error: "method not allowed" }); return; }
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.status(200).json(result ?? { ok: true });
    } catch (e) {
      if (res.headersSent) return;
      if (e instanceof ApiError) { res.status(e.status).json({ error: e.message }); return; }
      console.error(e);
      res.status(500).json({ error: "internal error" });
    }
  };
}
