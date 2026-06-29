import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest } from "next";

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    verifySessionCookie: vi.fn(async (c: string) =>
      c === "good" ? { uid: "admin" } : Promise.reject(new Error("bad")),
    ),
    createSessionCookie: vi.fn(async () => "cookie"),
  }),
}));
vi.mock("../firebase/admin", () => ({ getDb: vi.fn() }));

import { requireAdmin } from "./session";
import { ApiError } from "../api/respond";

const reqWithCookie = (session?: string) =>
  ({ cookies: session ? { session } : {} } as unknown as NextApiRequest);

describe("requireAdmin", () => {
  it("throws ApiError 401 when cookie missing", async () => {
    await expect(requireAdmin(reqWithCookie())).rejects.toMatchObject({ status: 401 });
    await expect(requireAdmin(reqWithCookie())).rejects.toBeInstanceOf(ApiError);
  });
  it("throws ApiError 401 when cookie invalid", async () => {
    await expect(requireAdmin(reqWithCookie("bad"))).rejects.toMatchObject({ status: 401 });
  });
  it("returns decoded token when cookie valid", async () => {
    const t = await requireAdmin(reqWithCookie("good"));
    expect(t.uid).toBe("admin");
  });
});
