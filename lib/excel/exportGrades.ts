import * as XLSX from "xlsx";
import { Internship } from "@/lib/types";
import { CRITERIA } from "@/lib/internship/grade";

export function buildGradesWorkbook(internships: Internship[]): XLSX.WorkBook {
  const rows = internships.map((it) => {
    const row: Record<string, string | number> = {
      "Nama Siswa": it.studentName ?? "",
      "Lokasi Magang": it.lokasiMagang ?? "",
      "Posisi": it.posisi ?? "",
      "Pembimbing": it.pembimbing ?? "",
    };
    for (const c of CRITERIA) row[c.label] = it.ratings?.[c.key] ?? "";
    row["Nilai"] = it.nilaiAkhir ?? "";
    row["Kategori"] = it.kategori ?? "";
    row["Tanggal"] = it.tanggal ?? "";
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nilai Magang");
  return wb;
}
