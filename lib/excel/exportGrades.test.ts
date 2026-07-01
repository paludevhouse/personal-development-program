import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildGradesWorkbook } from "./exportGrades";
import { Internship, InternshipRatings } from "@/lib/types";

const allA: InternshipRatings = {
  kedisiplinan: "A",
  kerjasama: "A",
  inisiatif: "A",
  tanggungJawab: "A",
  adaptasi: "A",
  memberiMasukan: "A",
  pengumpulanLaporan: "A",
};

const graded: Internship = {
  id: "1",
  studentId: "s1",
  academicYearId: "ay1",
  studentName: "Budi Santoso",
  lokasiMagang: "PT Maju Jaya",
  posisi: "Staff IT",
  pembimbing: "Pak Hendra",
  phone: "08123456789",
  token: "tok",
  status: "graded",
  ratings: allA,
  nilaiAkhir: 98,
  kategori: "sangat baik",
  tanggal: "2024-06-01",
};

describe("buildGradesWorkbook", () => {
  it("produces a workbook with sheet 'Nilai Magang'", () => {
    const wb = buildGradesWorkbook([graded]);
    expect(wb.SheetNames).toContain("Nilai Magang");
  });

  it("round-trips Nama Siswa and grade fields", () => {
    const wb = buildGradesWorkbook([graded]);
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets["Nilai Magang"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]["Nama Siswa"]).toBe("Budi Santoso");
    expect(rows[0]["Kedisiplinan"]).toBe("A");
    expect(rows[0]["Nilai"]).toBe(98);
    expect(rows[0]["Kategori"]).toBe("sangat baik");
  });

  it("includes all 7 criteria columns", () => {
    const wb = buildGradesWorkbook([graded]);
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets["Nilai Magang"]);
    expect(rows[0]["Kerjasama"]).toBe("A");
    expect(rows[0]["Inisiatif"]).toBe("A");
    expect(rows[0]["Tanggung Jawab"]).toBe("A");
    expect(rows[0]["Adaptasi"]).toBe("A");
    expect(rows[0]["Kemampuan Memberi Masukan"]).toBe("A");
    expect(rows[0]["Pengumpulan Laporan"]).toBe("A");
  });

  it("handles empty internships list", () => {
    const wb = buildGradesWorkbook([]);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Nilai Magang"]);
    expect(rows).toHaveLength(0);
  });
});
