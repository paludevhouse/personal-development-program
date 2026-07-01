import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import { methods, ApiError } from "./respond";

function mockRes() {
  const res = { headersSent: false, statusCode: 200 } as unknown as NextApiResponse & { body?: unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.status = vi.fn((c: number) => { (res as any).statusCode = c; return res; }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.json = vi.fn((b: unknown) => { (res as any).body = b; (res as any).headersSent = true; return res; }) as any;
  res.setHeader = vi.fn() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  return res as NextApiResponse & { statusCode: number; body?: unknown };
}
const req = (method: string) => ({ method } as NextApiRequest);

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
});
