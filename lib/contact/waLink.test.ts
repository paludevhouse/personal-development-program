import { describe, it, expect } from "vitest";
import { waLink } from "./waLink";

describe("waLink", () => {
  it("converts a leading-0 Indonesian number to 62", () => {
    expect(waLink("081234567890")).toBe("https://wa.me/6281234567890");
  });
  it("strips spaces, dashes and + and keeps 62 prefix", () => {
    expect(waLink("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
  });
  it("keeps an already-62 number", () => {
    expect(waLink("6281234567890")).toBe("https://wa.me/6281234567890");
  });
  it("prepends 62 to a bare 8-number", () => {
    expect(waLink("8123456789")).toBe("https://wa.me/628123456789");
  });
  it("returns null when there are no digits", () => {
    expect(waLink("")).toBeNull();
    expect(waLink("-")).toBeNull();
  });
});
