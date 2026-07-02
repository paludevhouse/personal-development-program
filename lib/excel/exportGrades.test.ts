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

const canvaRatings: InternshipRatings = {
  kedisiplinan: "A",
  kerjasama: "B",
  inisiatif: "A",
  tanggungJawab: "B",
  adaptasi: "B",
  memberiMasukan: "C",
  pengumpulanLaporan: "A",
};

const canvaExample: Internship = {
  id: "2",
  studentId: "s2",
  academicYearId: "ay1",
  studentName: "Muhammad Budi Santoso Susilo",
  lokasiMagang: "PT Sinar Abadi",
  posisi: "Tax Intern",
  pembimbing: "Bu Sri",
  phone: "08129876543",
  token: "tok2",
  status: "graded",
  ratings: canvaRatings,
  nilaiAkhir: 92.3,
  kategori: "baik",
  tanggal: "2024-06-01 - 2024-08-01",
};

const opts = {
  academicYear: "2025/2026",
  nisById: { s1: "12345", s2: "67890" },
  kelasById: { s1: "XII RPL 1", s2: "XII AKL 1" },
  genderById: { s1: "L" as const, s2: "P" as const },
};

function canvaRows(wb: XLSX.WorkBook) {
  return XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets["Canva"]);
}

// Helper: read data rows only (skip the 3 title rows)
function dataRows(wb: XLSX.WorkBook) {
  return XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets["Nilai Magang"], { range: 3 });
}

describe("buildGradesWorkbook", () => {
  it("produces a workbook with sheet 'Nilai Magang'", () => {
    const wb = buildGradesWorkbook([graded], opts);
    expect(wb.SheetNames).toContain("Nilai Magang");
  });

  it("includes title header rows", () => {
    const wb = buildGradesWorkbook([graded], opts);
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Nilai Magang"], { header: 1 });
    expect((grid[0] as string[])[0]).toBe("LAPORAN NILAI MAGANG");
    expect((grid[1] as string[])[0]).toMatch(/Tahun Ajaran: 2025\/2026/);
    expect((grid[2] as string[])[0]).toMatch(/Tanggal Cetak:/);
  });

  it("round-trips Nama Siswa, NIS, Kelas and grade fields", () => {
    const wb = buildGradesWorkbook([graded], opts);
    const rows = dataRows(wb);
    expect(rows).toHaveLength(1);
    expect(rows[0]["Nama Siswa"]).toBe("Budi Santoso");
    expect(rows[0]["NIS"]).toBe("12345");
    expect(rows[0]["Kelas"]).toBe("XII RPL 1");
    expect(rows[0]["Kedisiplinan"]).toBe("A");
    expect(rows[0]["Nilai"]).toBe(98);
    expect(rows[0]["Kategori"]).toBe("sangat baik");
  });

  it("includes all 7 criteria columns", () => {
    const wb = buildGradesWorkbook([graded], opts);
    const rows = dataRows(wb);
    expect(rows[0]["Kerjasama"]).toBe("A");
    expect(rows[0]["Inisiatif"]).toBe("A");
    expect(rows[0]["Tanggung Jawab"]).toBe("A");
    expect(rows[0]["Adaptasi"]).toBe("A");
    expect(rows[0]["Kemampuan Memberi Masukan"]).toBe("A");
    expect(rows[0]["Pengumpulan Laporan"]).toBe("A");
  });

  it("handles empty internships list", () => {
    const wb = buildGradesWorkbook([], opts);
    const rows = dataRows(wb);
    expect(rows).toHaveLength(0);
  });

  it("includes a Canva sheet with a header row and one row per student", () => {
    const wb = buildGradesWorkbook([graded, canvaExample], opts);
    expect(wb.SheetNames).toContain("Canva");
    const rows = canvaRows(wb);
    expect(rows).toHaveLength(2);
  });

  it("Canva sheet shortens the name, maps kategori to English, and reports letters/score/pronoun", () => {
    const wb = buildGradesWorkbook([canvaExample], opts);
    const row = canvaRows(wb)[0];
    expect(row["Full Name"]).toBe("Muhammad Budi Santoso Susilo");
    expect(row["Name"]).toBe("Muhammad Budi S. S.");
    expect(row["Class"]).toBe("XII AKL 1");
    expect(row["Student Number"]).toBe("67890");
    expect(row["Discipline"]).toBe("A");
    expect(row["Overall Performance"]).toBe("Good");
    expect(row["Score"]).toBe(92.3);
    expect(row["Pronoun"]).toBe("her");
  });

  it("Canva sheet generates the exact certificate paragraph per student", () => {
    const wb = buildGradesWorkbook([canvaExample], opts);
    const row = canvaRows(wb)[0];
    expect(row["Certificate Text"]).toBe(
      "For successfully completing her internship at PT Sinar Abadi as a Tax Intern, in fulfillment of the Personal Development Program at Masa Depan Cerah Senior High School for the 2025/2026 academic year",
    );
  });

  it("Canva sheet uses his for male students", () => {
    const wb = buildGradesWorkbook([graded], opts);
    const row = canvaRows(wb)[0];
    expect(row["Pronoun"]).toBe("his");
    expect(row["Certificate Text"]).toContain("completing his internship");
  });
});
