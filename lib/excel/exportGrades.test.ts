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

const opts = {
  academicYear: "2025/2026",
  nisById: { s1: "12345" },
  kelasById: { s1: "XII RPL 1" },
};

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
});
