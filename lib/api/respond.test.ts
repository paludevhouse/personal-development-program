import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

vi.mock("../db/versions", () => ({
  getVersions: vi.fn(async (cols: string[]) => cols.map((c) => `${c}:1`).join(",")),
}));
vi.mock("../auth/verify", () => ({
  hasValidSession: vi.fn(async () => true),
}));

import { methods, ApiError } from "./respond";
import { getVersions } from "../db/versions";
import { hasValidSession } from "../auth/verify";

function mockRes() {
  const headers: Record<string, string> = {};
  const res = { headersSent: false, statusCode: 200, _headers: headers } as unknown as NextApiResponse & { body?: unknown; _headers: Record<string, string> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.status = vi.fn((c: number) => { (res as any).statusCode = c; return res; }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.json = vi.fn((b: unknown) => { (res as any).body = b; (res as any).headersSent = true; return res; }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = vi.fn(() => { (res as any).headersSent = true; return res; }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.setHeader = vi.fn((k: string, v: string) => { headers[k] = v; }) as any;
  return res as NextApiResponse & { statusCode: number; body?: unknown; _headers: Record<string, string> };
}
const req = (method: string, headers: Record<string, string> = {}) => ({ method, headers } as unknown as NextApiRequest);

describe("methods", () => {
  it("dispatches to the matching method and sends JSON 200", async () => {
    const res = mockRes();
    await methods({ GET: async () => ({ ok: true }) })(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ ok: true });
  });
  it("returns 405 for an unmapped method", async () => {
    const res = mockRes();
    await methods({ GET: async () => ({}) })(req("POST"), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
  it("maps a thrown ApiError to its status", async () => {
    const res = mockRes();
    await methods({ GET: async () => { throw new ApiError(401, "no"); } })(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: "no" });
  });
  it("maps an unexpected error to 500", async () => {
    const res = mockRes();
    await methods({ GET: async () => { throw new Error("boom"); } })(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it("does not double-send when handler already responded", async () => {
    const res = mockRes();
    await methods({ GET: async (_r, r) => { r.status(204).json({ done: true }); } })(req("GET"), res);
    expect(res.body).toEqual({ done: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((res.status as any).mock.calls.length).toBe(1);
  });

  describe("etag option", () => {
    it("sets a weak ETag from getVersions and runs the handler on a miss", async () => {
      const res = mockRes();
      const handler = vi.fn(async () => [1, 2, 3]);
      await methods({ GET: handler }, { etag: { GET: ["students"] } })(req("GET"), res);
      expect(getVersions).toHaveBeenCalledWith(["students"]);
      expect(handler).toHaveBeenCalled();
      expect(res._headers["ETag"]).toBe('W/"students:1"');
      expect(res._headers["Cache-Control"]).toBe("private, no-cache");
      expect(res.body).toEqual([1, 2, 3]);
    });

    it("short-circuits with 304 and skips the handler when If-None-Match matches", async () => {
      const res = mockRes();
      const handler = vi.fn(async () => [1, 2, 3]);
      await methods(
        { GET: handler },
        { etag: { GET: ["students"] } }
      )(req("GET", { "if-none-match": 'W/"students:1"' }), res);
      expect(handler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(304);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((res.end as any)).toHaveBeenCalled();
    });

    it("returns 401 (no ETag, no 304) when the session is invalid", async () => {
      vi.mocked(hasValidSession).mockResolvedValueOnce(false);
      const res = mockRes();
      const handler = vi.fn(async () => [1, 2, 3]);
      await methods(
        { GET: handler },
        { etag: { GET: ["students"] } }
      )(req("GET", { "if-none-match": 'W/"students:1"' }), res);
      expect(handler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res._headers["ETag"]).toBeUndefined();
    });

    it("uses no-store (not ETag) for routes without the etag option", async () => {
      const res = mockRes();
      await methods({ GET: async () => ({ ok: true }) })(req("GET"), res);
      expect(res._headers["Cache-Control"]).toBe("no-store");
      expect(res._headers["ETag"]).toBeUndefined();
    });
  });
});
