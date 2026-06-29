import { describe, it, expect } from "vitest";
import { fillTemplate } from "./fillTemplate";

describe("fillTemplate", () => {
  it("replaces all known placeholders", () => {
    const out = fillTemplate("Halo {pic}, nilai {siswa} di {perusahaan}: {link}", {
      pic: "Wenly", siswa: "Aaron", perusahaan: "T4U", link: "https://x/grade/abc",
    });
    expect(out).toBe("Halo Wenly, nilai Aaron di T4U: https://x/grade/abc");
  });
  it("replaces repeated placeholders and defaults missing to empty", () => {
    expect(fillTemplate("{pic} {pic} {siswa}", { pic: "A" })).toBe("A A ");
  });
  it("leaves unknown braces untouched", () => {
    expect(fillTemplate("{pic} {unknown}", { pic: "A" })).toBe("A {unknown}");
  });
});
