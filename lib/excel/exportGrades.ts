import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Internship } from "@/lib/types";
import { CRITERIA } from "@/lib/internship/grade";

export function buildGradesWorkbook(
  internships: Internship[],
  opts: { academicYear: string; nisById?: Record<string, string>; kelasById?: Record<string, string> },
): XLSX.WorkBook {
  const rows = internships.map((it) => {
    const row: Record<string, string | number> = {
      "Nama Siswa": it.studentName ?? "",
      "NIS": opts.nisById?.[it.studentId] ?? "",
      "Kelas": opts.kelasById?.[it.studentId] ?? "",
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
  const ws = XLSX.utils.aoa_to_sheet([
    ["LAPORAN NILAI MAGANG"],
    [`Tahun Ajaran: ${opts.academicYear}`],
    [`Tanggal Cetak: ${dayjs().format("D MMMM YYYY")}`],
    [],
  ]);
  XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nilai Magang");
  return wb;
}
