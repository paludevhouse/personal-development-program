import { describe, it, expect } from "vitest";
import { academicYearSchema, companySchema, internshipSchema, parseOrThrow } from "./schemas";

describe("schemas", () => {
  it("rejects empty academic year", () => {
    expect(() => parseOrThrow(academicYearSchema, { year: "", semester: "1 (Satu)" })).toThrow("Tahun wajib diisi");
  });
  it("accepts a valid academic year and defaults isActive", () => {
    expect(parseOrThrow(academicYearSchema, { year: "2025/2026", semester: "1 (Satu)" })).toEqual({ year: "2025/2026", semester: "1 (Satu)", isActive: false });
  });
  it("rejects company without perusahaan", () => {
    expect(() => parseOrThrow(companySchema, { perusahaan: "" })).toThrow("Nama perusahaan wajib diisi");
  });
  it("rejects internship without student", () => {
    expect(() => parseOrThrow(internshipSchema, { academicYearId: "y1" })).toThrow("Siswa wajib dipilih");
  });
});
