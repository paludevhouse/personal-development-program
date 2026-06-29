import { describe, it, expect, vi } from "vitest";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [],
  initializeApp: vi.fn(() => ({})),
  cert: vi.fn(() => ({})),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => ({ collection: vi.fn() })),
}));

describe("getDb", () => {
  it("returns a Firestore-like object with collection()", async () => {
    process.env.FIREBASE_PROJECT_ID = "p";
    process.env.FIREBASE_CLIENT_EMAIL = "e";
    process.env.FIREBASE_PRIVATE_KEY = "k";
    const { getDb } = await import("./admin");
    expect(typeof getDb().collection).toBe("function");
  });
});
