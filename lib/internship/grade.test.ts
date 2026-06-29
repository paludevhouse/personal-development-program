import { describe, it, expect } from "vitest";
import { ratingToScore, computeGrade, CRITERIA } from "./grade";
import { InternshipRatings } from "@/lib/types";

const all = (r: "A" | "B" | "C"): InternshipRatings => ({
  kedisiplinan: r, kerjasama: r, inisiatif: r, tanggungJawab: r,
  adaptasi: r, memberiMasukan: r, pengumpulanLaporan: r,
});

describe("ratingToScore", () => {
  it("maps A/B/C to 98/90/82", () => {
    expect(ratingToScore("A")).toBe(98);
    expect(ratingToScore("B")).toBe(90);
    expect(ratingToScore("C")).toBe(82);
  });
});

describe("computeGrade", () => {
  it("all A → 98, sangat baik", () => {
    expect(computeGrade(all("A"))).toEqual({ nilaiAkhir: 98, kategori: "sangat baik" });
  });
  it("all B → 90, baik", () => {
    expect(computeGrade(all("B"))).toEqual({ nilaiAkhir: 90, kategori: "baik" });
  });
  it("all C → 82, cukup baik", () => {
    expect(computeGrade(all("C"))).toEqual({ nilaiAkhir: 82, kategori: "cukup baik" });
  });
  it("matches spreadsheet row: A,B,A,B,B,C,A → ~92.29 baik", () => {
    const g = computeGrade({ kedisiplinan: "A", kerjasama: "B", inisiatif: "A", tanggungJawab: "B", adaptasi: "B", memberiMasukan: "C", pengumpulanLaporan: "A" });
    expect(g.nilaiAkhir).toBeCloseTo(92.2857, 3);
    expect(g.kategori).toBe("baik");
  });
  it("six A and one B → ~96.86 sangat baik (> 94.5)", () => {
    const g = computeGrade({ kedisiplinan: "A", kerjasama: "A", inisiatif: "A", tanggungJawab: "A", adaptasi: "B", memberiMasukan: "A", pengumpulanLaporan: "A" });
    expect(g.nilaiAkhir).toBeCloseTo(96.8571, 3);
    expect(g.kategori).toBe("sangat baik");
  });
  it("throws if a rating is missing", () => {
    expect(() => computeGrade({ ...all("A"), kerjasama: null })).toThrow();
  });
});

describe("CRITERIA", () => {
  it("lists all 7 criteria in order", () => {
    expect(CRITERIA.map((c) => c.key)).toEqual([
      "kedisiplinan", "kerjasama", "inisiatif", "tanggungJawab", "adaptasi", "memberiMasukan", "pengumpulanLaporan",
    ]);
  });
});
