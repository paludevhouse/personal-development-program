import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;

export function methods(map: Partial<Record<Method, Handler>>): NextApiHandler {
  return async (req, res) => {
    const fn = map[(req.method ?? "GET") as Method];
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
