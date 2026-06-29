import { describe, it, expect } from "vitest";
import { newToken } from "./token";

describe("newToken", () => {
  it("is URL-safe and long enough", () => {
    expect(newToken()).toMatch(/^[A-Za-z0-9_-]{24,}$/);
  });
  it("is unique across calls", () => {
    expect(newToken()).not.toBe(newToken());
  });
});
